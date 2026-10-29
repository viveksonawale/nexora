import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser } from "@/server/policies/policy";
import { HackathonStatus, OrgRole, HackathonStaffRole, SessionStatus, AttendanceMethod } from "@prisma/client";
import { HackathonLifecycle } from "@/server/modules/hackathon/hackathon-lifecycle";
import {
  generateDisplayKey,
  hashDisplayKey,
  verifyDisplayKey,
  generateSessionSecret,
  generateAttendanceToken,
  verifyAttendanceToken,
  computeTimeToNextRotation,
} from "./attendance-crypto";

export class AttendanceService {
  /**
   * Strictly verifies whether a user is an authorized organizer of the hackathon on the server.
   */
  static async verifyOrganizer(user: AuthUser, hackathonId: string) {
    if (user.platformRole === "SUPER_ADMIN") return true;

    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      select: { organizationId: true, createdById: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    if (hackathon.createdById === user.id) return true;

    // College owner / admin
    const orgMembership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: hackathon.organizationId,
          userId: user.id,
        },
      },
    });
    if (orgMembership?.role === OrgRole.OWNER || orgMembership?.role === OrgRole.ADMIN) {
      return true;
    }

    // Hackathon staff role
    const staffEntry = await db.hackathonStaff.findFirst({
      where: {
        hackathonId,
        userId: user.id,
        role: { in: [HackathonStaffRole.ORGANIZER, HackathonStaffRole.CO_ORGANIZER] },
        status: "ACTIVE",
      },
    });
    if (staffEntry) return true;

    throw AppError.forbidden("Organizer permissions required for this hackathon.");
  }

  /**
   * Start session: allowed only while the hackathon is LIVE.
   * Creates the session, generates a 32-byte random display key, stores only its hash,
   * returns the display link once, and creates a Notification for every APPROVED registrant.
   */
  static async startSession(user: AuthUser, hackathonId: string, title?: string) {
    await this.verifyOrganizer(user, hackathonId);

    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true, title: true, status: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    HackathonLifecycle.assertState(
      hackathon.status,
      [HackathonStatus.LIVE],
      "Start Attendance Session"
    );

    const { displayKey, displayKeyHash } = generateDisplayKey();
    const sessionSecret = generateSessionSecret();

    // End any previously active sessions for this hackathon to ensure single active session
    await db.attendanceSession.updateMany({
      where: { hackathonId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.ENDED, endedAt: new Date() },
    });

    const session = await db.attendanceSession.create({
      data: {
        hackathonId,
        createdById: user.id,
        title: title || `${hackathon.title} Attendance Session`,
        status: SessionStatus.ACTIVE,
        startedAt: new Date(),
        secret: sessionSecret,
        displayKeyHash,
      },
    });

    // Create notifications for all APPROVED registrants
    const approvedRegistrants = await db.registration.findMany({
      where: { hackathonId, status: "APPROVED" },
      select: { userId: true },
    });

    if (approvedRegistrants.length > 0) {
      await db.notification.createMany({
        data: approvedRegistrants.map((reg) => ({
          userId: reg.userId,
          type: "ATTENDANCE_SESSION_ACTIVE",
          title: "Attendance Check-In Live!",
          body: `Live attendance session is now active for ${hackathon.title}. Scan the projector QR code to verify your presence.`,
          link: `/hackathons/${hackathonId}/check-in`,
        })),
      });
    }

    return {
      session: {
        id: session.id,
        hackathonId: session.hackathonId,
        title: session.title,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
      },
      displayKey, // Returned ONCE
      displayLink: `/attendance/display/${displayKey}`,
      approvedRegistrantsNotified: approvedRegistrants.length,
    };
  }

  /**
   * Regenerate display link: invalidates the old key.
   */
  static async regenerateDisplayKey(user: AuthUser, hackathonId: string, sessionId: string) {
    await this.verifyOrganizer(user, hackathonId);

    const session = await db.attendanceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.hackathonId !== hackathonId) {
      throw AppError.notFound("Attendance session not found");
    }

    const { displayKey, displayKeyHash } = generateDisplayKey();

    await db.attendanceSession.update({
      where: { id: sessionId },
      data: { displayKeyHash },
    });

    return {
      displayKey, // Returned ONCE
      displayLink: `/attendance/display/${displayKey}`,
    };
  }

  /**
   * Pause, resume, end session
   */
  static async updateSessionStatus(
    user: AuthUser,
    hackathonId: string,
    sessionId: string,
    newStatus: SessionStatus
  ) {
    await this.verifyOrganizer(user, hackathonId);

    const session = await db.attendanceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.hackathonId !== hackathonId) {
      throw AppError.notFound("Attendance session not found");
    }

    const updated = await db.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: newStatus,
        ...(newStatus === SessionStatus.ENDED && !session.endedAt ? { endedAt: new Date() } : {}),
      },
      select: {
        id: true,
        hackathonId: true,
        title: true,
        status: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Get active or latest session for a hackathon
   */
  static async getActiveSession(hackathonId: string) {
    const session = await db.attendanceSession.findFirst({
      where: { hackathonId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        hackathonId: true,
        title: true,
        status: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
    });
    return session;
  }

  /**
   * List attendance for a session, with present and absent students (Organizer only)
   */
  static async listAttendance(user: AuthUser, hackathonId: string, sessionId: string) {
    await this.verifyOrganizer(user, hackathonId);

    const session = await db.attendanceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        hackathonId: true,
        title: true,
        status: true,
        startedAt: true,
        endedAt: true,
      },
    });
    if (!session || session.hackathonId !== hackathonId) {
      throw AppError.notFound("Attendance session not found");
    }

    // 1. Get all APPROVED registrants for this hackathon
    const registrants = await db.registration.findMany({
      where: { hackathonId, status: "APPROVED" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        teamMember: { include: { team: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Get attendance records for this session
    const records = await db.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        markedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { markedAt: "desc" },
    });

    const presentUserMap = new Map(records.map((r) => [r.userId, r]));

    const present = records.map((r) => {
      const reg = registrants.find((rg) => rg.userId === r.userId);
      return {
        recordId: r.id,
        userId: r.userId,
        name: r.user.name,
        email: r.user.email,
        teamName: reg?.teamMember?.team?.name || null,
        method: r.method,
        markedAt: r.markedAt,
        markedBy: r.markedBy ? { id: r.markedBy.id, name: r.markedBy.name } : null,
      };
    });

    const absent = registrants
      .filter((r) => !presentUserMap.has(r.userId))
      .map((r) => ({
        registrationId: r.id,
        userId: r.userId,
        name: r.user.name,
        email: r.user.email,
        teamName: r.teamMember?.team?.name || null,
      }));

    return {
      session,
      metrics: {
        totalApproved: registrants.length,
        presentCount: present.length,
        absentCount: absent.length,
      },
      present,
      absent,
    };
  }

  /**
   * Manual mark: creates an AttendanceRecord with method MANUAL and markedBy set. Idempotent.
   */
  static async manualMark(
    user: AuthUser,
    hackathonId: string,
    sessionId: string,
    targetUserId: string
  ) {
    await this.verifyOrganizer(user, hackathonId);

    const session = await db.attendanceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.hackathonId !== hackathonId) {
      throw AppError.notFound("Attendance session not found");
    }

    // Verify target user is an APPROVED registrant
    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId, userId: targetUserId } },
    });
    if (!reg) {
      throw AppError.notFound("User is not registered for this hackathon.");
    }
    if (reg.status !== "APPROVED") {
      throw AppError.businessRule(
        "INVALID_STATE",
        `Only APPROVED participants can be marked present. Current status: ${reg.status}.`
      );
    }

    // Idempotent check
    const existingRecord = await db.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: targetUserId,
        },
      },
      include: {
        markedBy: { select: { id: true, name: true } },
      },
    });

    if (existingRecord) {
      return {
        success: true,
        alreadyMarked: true,
        record: existingRecord,
        message: "Attendance was already marked for this participant.",
      };
    }

    const [record] = await db.$transaction([
      db.attendanceRecord.create({
        data: {
          sessionId,
          userId: targetUserId,
          registrationId: reg.id,
          method: AttendanceMethod.MANUAL,
          markedById: user.id,
          markedAt: new Date(),
        },
        include: {
          markedBy: { select: { id: true, name: true } },
        },
      }),
      db.registration.update({
        where: { id: reg.id },
        data: {
          checkedInAt: reg.checkedInAt || new Date(),
          checkedInById: reg.checkedInById || user.id,
        },
      }),
    ]);

    return {
      success: true,
      alreadyMarked: false,
      record,
      message: "Participant marked present successfully.",
    };
  }

  /**
   * Student Scan endpoint checks in order:
   * 1. authenticated (handled by withApi)
   * 2. session ACTIVE
   * 3. token valid within window
   * 4. user is an APPROVED registrant of this hackathon
   * 5. no existing record. Duplicate returns "already marked".
   * Rate limit and log attempts.
   */
  static async scanAttendanceToken(user: AuthUser, hackathonId: string, token: string) {
    // 2. Find active session
    const session = await db.attendanceSession.findFirst({
      where: { hackathonId, status: SessionStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      throw AppError.businessRule(
        "INVALID_STATE",
        "There is no active attendance session for this event. Please wait for an organizer to start one."
      );
    }

    // 3. Token valid within window (current W0 or previous W0-1)
    const verification = verifyAttendanceToken(token, session.secret);
    if (!verification.valid || verification.sessionId !== session.id) {
      throw AppError.businessRule(
        "INVALID_STATE",
        verification.error || "The attendance QR code is invalid or has expired. Please scan the current code on the screen."
      );
    }

    // 4. User is an APPROVED registrant of this hackathon
    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId, userId: user.id } },
    });

    if (!reg) {
      throw AppError.notFound("You are not registered for this hackathon.");
    }

    if (reg.status !== "APPROVED") {
      throw AppError.businessRule(
        "INVALID_STATE",
        `Only APPROVED participants can check in. Your current status is ${reg.status}.`
      );
    }

    // 5. No existing record. Duplicate returns "already marked" (idempotent)
    const existing = await db.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        alreadyMarked: true,
        message: "already marked",
        record: existing,
      };
    }

    const [record] = await db.$transaction([
      db.attendanceRecord.create({
        data: {
          sessionId: session.id,
          userId: user.id,
          registrationId: reg.id,
          method: AttendanceMethod.QR,
          markedAt: new Date(),
        },
      }),
      db.registration.update({
        where: { id: reg.id },
        data: {
          checkedInAt: reg.checkedInAt || new Date(),
          checkedInById: reg.checkedInById || user.id,
        },
      }),
      db.auditLog.create({
        data: {
          actorId: user.id,
          hackathonId,
          action: "attendance.scan",
          entityType: "AttendanceRecord",
          entityId: session.id,
          metadata: {
            sessionId: session.id,
            method: "QR",
          },
        },
      }),
    ]);

    return {
      success: true,
      alreadyMarked: false,
      message: "Attendance confirmed! Keep building.",
      record,
    };
  }

  /**
   * Verify access for the display page:
   * Requires login. Verifies user is the organizer who owns the session and key hash matches (constant-time compare);
   * otherwise returns 403 or redirects. Shows ONLY large QR, countdown, checked-in count.
   * NEVER exposes student names or the list.
   */
  static async verifyDisplayAccess(user: AuthUser | null, displayKey: string) {
    if (!user) {
      throw AppError.unauthenticated("Authentication required to access the projector display.");
    }

    if (!displayKey || typeof displayKey !== "string") {
      throw AppError.forbidden("Invalid display key.");
    }

    const displayKeyHash = hashDisplayKey(displayKey);

    const session = await db.attendanceSession.findFirst({
      where: { displayKeyHash },
      include: {
        hackathon: {
          select: { id: true, title: true, organizationId: true, createdById: true },
        },
      },
    });

    if (!session) {
      throw AppError.forbidden("Access denied: invalid display key.");
    }

    // Constant-time compare on key
    if (!verifyDisplayKey(displayKey, session.displayKeyHash)) {
      throw AppError.forbidden("Access denied: key verification failed.");
    }

    // Verify user is organizer of that hackathon
    await this.verifyOrganizer(user, session.hackathonId);

    const checkedInCount = await db.attendanceRecord.count({
      where: { sessionId: session.id },
    });

    return {
      session: {
        id: session.id,
        hackathonId: session.hackathonId,
        hackathonTitle: session.hackathon.title,
        title: session.title,
        status: session.status,
      },
      checkedInCount,
    };
  }

  /**
   * Endpoint polled by display page: returns current token, seconds until next rotation, and checked-in count.
   * NEVER returns student names or list.
   */
  static async getDisplayToken(displayKey: string) {
    if (!displayKey || typeof displayKey !== "string") {
      throw AppError.forbidden("Invalid display key.");
    }

    const displayKeyHash = hashDisplayKey(displayKey);

    const session = await db.attendanceSession.findFirst({
      where: { displayKeyHash },
      select: {
        id: true,
        hackathonId: true,
        status: true,
        secret: true,
        displayKeyHash: true,
      },
    });

    if (!session || !verifyDisplayKey(displayKey, session.displayKeyHash)) {
      throw AppError.forbidden("Access denied.");
    }

    const checkedInCount = await db.attendanceRecord.count({
      where: { sessionId: session.id },
    });

    if (session.status !== SessionStatus.ACTIVE) {
      return {
        status: session.status,
        token: null,
        secondsRemaining: 0,
        checkedInCount,
      };
    }

    const tokenData = generateAttendanceToken(session.id, session.secret);

    return {
      status: session.status,
      token: tokenData.token,
      secondsRemaining: tokenData.secondsRemaining,
      checkedInCount,
    };
  }
}
