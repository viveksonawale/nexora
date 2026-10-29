import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { RegistrationStatus, HackathonStatus, HackathonStaffRole } from "@prisma/client";
import { z } from "zod";
import {
  CreateRegistrationSchema,
  UpdateRegistrationStatusSchema,
  BulkUpdateRegistrationStatusSchema,
  CheckInSchema,
  QueryRegistrationSchema,
} from "./registration.schemas";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { env } from "@/server/lib/env";
import { AttendanceSessionService } from "@/server/modules/attendance/attendance-session.service";
import { HackathonLifecycle } from "@/server/modules/hackathon/hackathon-lifecycle";
import { queueEmail } from "@/server/modules/email/email.service";

export class RegistrationService {
  /**
   * Helper to ensure the user can manage registrations (OrgAdmin or Staff).
   */
  private static async getHackathonAndVerifyStaff(user: AuthUser, hackathonId: string) {
    const isCuid = hackathonId.length >= 24;
    const hackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: hackathonId } : { slug: hackathonId },
      include: { organization: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");
    const actualHackathonId = hackathon.id;

    if (user.platformRole === "SUPER_ADMIN") {
      return { hackathon, isStaffOrAdmin: true, isOrgAdmin: true };
    }

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    const isOrgAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";

    const staffEntry = await db.hackathonStaff.findFirst({
      where: {
        hackathonId: actualHackathonId,
        userId: user.id,
        role: { in: [HackathonStaffRole.ORGANIZER, HackathonStaffRole.CO_ORGANIZER, HackathonStaffRole.REGISTRATION_MANAGER] },
        status: "ACTIVE",
      },
    });

    if (!isOrgAdmin && !staffEntry) {
      throw AppError.forbidden("Permission denied. Must be a hackathon organizer or college admin.");
    }

    return { hackathon, membership, isStaffOrAdmin: true, isOrgAdmin };
  }

  static async register(user: AuthUser, hackathonId: string, data: z.infer<typeof CreateRegistrationSchema>) {
    const profile = await db.profile.findUnique({ where: { userId: user.id } });
    if (!profile?.onboardingCompleted) {
      throw AppError.businessRule("ONBOARDING_INCOMPLETE", "Complete your profile onboarding before registering.");
    }

    const isCuid = hackathonId.length >= 24;
    const hackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: hackathonId } : { slug: hackathonId },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");
    const actualHackathonId = hackathon.id;

    // Central lifecycle state check
    HackathonLifecycle.assertState(
      hackathon.status,
      [HackathonStatus.REGISTRATION_OPEN, HackathonStatus.PUBLISHED],
      "Hackathon Registration"
    );

    const now = new Date();
    if (
      hackathon.registrationOpensAt &&
      hackathon.registrationClosesAt &&
      (now < hackathon.registrationOpensAt || now > hackathon.registrationClosesAt)
    ) {
      throw AppError.conflict("Registration period has ended or not yet started.");
    }

    const existing = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: actualHackathonId, userId: user.id } },
    });
    if (existing) {
      throw AppError.conflict("You are already registered.");
    }

    // Capacity checking (transactional)
    return db.$transaction(async (tx) => {
      // Default to PENDING for organizer review
      let status: RegistrationStatus = RegistrationStatus.PENDING;

      if (hackathon.maxParticipants) {
        const approvedCount = await tx.registration.count({
          where: { hackathonId: actualHackathonId, status: "APPROVED" },
        });

        if (approvedCount >= hackathon.maxParticipants) {
          status = RegistrationStatus.WAITLISTED;
        }
      }

      const qrToken = randomBytes(16).toString("hex");

      const registration = await tx.registration.create({
        data: {
          hackathonId: actualHackathonId,
          userId: user.id,
          status,
          answers: data.answers as any,
          qrToken,
          waitlistedAt: status === RegistrationStatus.WAITLISTED ? new Date() : null,
        },
      });

      return registration;
    });
  }

  static async getMyRegistration(user: AuthUser, hackathonId: string) {
    const isCuid = hackathonId.length >= 24;
    const hackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: hackathonId } : { slug: hackathonId },
      select: { id: true },
    });
    const actualHackathonId = hackathon ? hackathon.id : hackathonId;

    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: actualHackathonId, userId: user.id } },
      include: {
        teamMember: { include: { team: true } },
      },
    });
    if (!reg) throw AppError.notFound("Registration not found.");
    return reg;
  }

  static async withdraw(user: AuthUser, hackathonId: string) {
    const isCuid = hackathonId.length >= 24;
    const hackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: hackathonId } : { slug: hackathonId },
      select: { id: true },
    });
    const actualHackathonId = hackathon ? hackathon.id : hackathonId;

    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: actualHackathonId, userId: user.id } },
      include: { teamMember: { include: { team: true } } },
    });
    if (!reg) throw AppError.notFound("Registration not found.");

    if (reg.teamMember) {
      if (reg.teamMember.role === "LEADER") {
        throw AppError.businessRule("INVALID_STATE", "Team leaders must transfer leadership or delete the team before withdrawing.");
      }
      await db.teamMember.delete({ where: { id: reg.teamMember.id } });
    }

    await db.registration.update({
      where: { id: reg.id },
      data: { status: RegistrationStatus.WITHDRAWN },
    });

    // TODO: Auto-promote from waitlist if applicable (omitted for brevity, can be a background job)

    return { success: true };
  }

  static async getQrToken(user: AuthUser, id: string) {
    const reg = await db.registration.findUnique({ where: { id } });
    if (!reg) throw AppError.notFound("Not found");
    if (reg.userId !== user.id) throw AppError.forbidden("Access denied");
    // Generate short-lived JWT (valid for 30 seconds)
    const token = jwt.sign(
      { registrationId: reg.id },
      (env as any).JWT_ACCESS_SECRET || "fallback_secret_for_dev",
      { expiresIn: "30s" }
    );
    
    return { qrToken: token };
  }

  static async getRegistrations(user: AuthUser, hackathonId: string, query: z.infer<typeof QueryRegistrationSchema>) {
    const { hackathon } = await this.getHackathonAndVerifyStaff(user, hackathonId);

    const where: any = { hackathonId: hackathon.id };
    if (query.status) where.status = query.status;
    if (query.q) {
      where.user = {
        OR: [
          { name: { contains: query.q, mode: "insensitive" } },
          { email: { contains: query.q, mode: "insensitive" } },
        ],
      };
    }
    if (query.checkedIn === "true") where.checkedInAt = { not: null };
    if (query.checkedIn === "false") where.checkedInAt = null;
    if (query.hasTeam === "true") where.teamMember = { isNot: null };
    if (query.hasTeam === "false") where.teamMember = null;

    return db.registration.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true, headline: true } } } },
        teamMember: { include: { team: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateStatus(user: AuthUser, id: string, data: z.infer<typeof UpdateRegistrationStatusSchema>) {
    const reg = await db.registration.findUnique({
      where: { id },
      include: { hackathon: true, user: { select: { email: true, name: true } } },
    });
    if (!reg) throw AppError.notFound("Registration not found");

    await this.getHackathonAndVerifyStaff(user, reg.hackathonId);

    const updated = await db.registration.update({
      where: { id },
      data: { status: data.status },
    });

    try {
      await queueEmail({
        toEmail: reg.user.email,
        template: "notification",
        payload: {
          subject: `Registration ${data.status} - ${reg.hackathon.title}`,
          message: `Your registration for ${reg.hackathon.title} is now ${data.status}.`,
          status: data.status,
          hackathonId: reg.hackathonId,
        },
      });
    } catch {
      // Best effort
    }

    return updated;
  }

  static async bulkUpdateStatus(user: AuthUser, hackathonId: string, data: z.infer<typeof BulkUpdateRegistrationStatusSchema>) {
    const { hackathon } = await this.getHackathonAndVerifyStaff(user, hackathonId);
    const actualHackathonId = hackathon.id;

    const affected = await db.registration.findMany({
      where: { hackathonId: actualHackathonId, id: { in: data.ids } },
      include: { user: { select: { email: true, name: true } } },
    });

    await db.registration.updateMany({
      where: { hackathonId: actualHackathonId, id: { in: data.ids } },
      data: { status: data.status },
    });

    for (const reg of affected) {
      try {
        await queueEmail({
          toEmail: reg.user.email,
          template: "notification",
          payload: {
            subject: `Registration ${data.status} - ${hackathon?.title}`,
            message: `Your registration for ${hackathon?.title} is now ${data.status}.`,
            status: data.status,
            hackathonId: actualHackathonId,
          },
        });
      } catch {
        // Best effort
      }
    }

    return { success: true };
  }

  static async checkIn(user: AuthUser, hackathonId: string, data: z.infer<typeof CheckInSchema>) {
    const isCuid = hackathonId.length >= 24;
    const targetHackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: hackathonId } : { slug: hackathonId },
      select: { id: true, status: true, title: true },
    });
    if (!targetHackathon) throw AppError.notFound("Hackathon not found");
    const actualHackathonId = targetHackathon.id;

    HackathonLifecycle.assertState(
      targetHackathon.status,
      [HackathonStatus.LIVE, HackathonStatus.PUBLISHED],
      "Attendance Check-In"
    );

    // 1. Check if this is a Dynamic Attendance QR Code (Student Self Check-in)
    if (data.qrToken && data.qrToken.startsWith("NEXORA_ATTENDANCE:")) {
      const parts = data.qrToken.split(":");
      let parsedHackathonId = actualHackathonId;
      let sessionId = "";
      let timestampStr = "";

      if (parts.length >= 5) {
        // Format: NEXORA_ATTENDANCE:<hackathonId>:<sessionId>:<rotation>:<timestamp>
        parsedHackathonId = parts[1];
        sessionId = parts[2];
        timestampStr = parts[4];
      } else if (parts.length === 4) {
        // Format: NEXORA_ATTENDANCE:<sessionId>:<rotation>:<timestamp>
        sessionId = parts[1];
        timestampStr = parts[3];
      } else {
        throw AppError.businessRule("INVALID_STATE", "Unrecognized attendance QR code format.");
      }

      if (parsedHackathonId !== actualHackathonId && parsedHackathonId !== hackathonId) {
        throw AppError.businessRule("INVALID_STATE", "This QR code belongs to a different hackathon event.");
      }

      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp) || Date.now() - timestamp > 120000) {
        throw AppError.businessRule("INVALID_STATE", "This QR code has expired. Please scan the active code displayed on screen.");
      }

      // Check if session is currently active
      const session = AttendanceSessionService.getSession(actualHackathonId);
      if (session.status !== "ACTIVE") {
        throw AppError.businessRule("INVALID_STATE", "The attendance session is currently not active. Please wait for the organizer.");
      }

      const reg = await db.registration.findUnique({
        where: { hackathonId_userId: { hackathonId: actualHackathonId, userId: user.id } },
        include: {
          user: { select: { id: true, name: true, email: true } },
          teamMember: { include: { team: { select: { id: true, name: true } } } },
          hackathon: { select: { id: true, title: true } },
        },
      });

      if (!reg) {
        throw AppError.notFound("You are not registered for this hackathon. Please register first.");
      }

      if (reg.status !== "APPROVED") {
        throw AppError.businessRule("INVALID_STATE", `Only APPROVED participants can check in. Your current status is ${reg.status}.`);
      }

      if (reg.checkedInAt) {
        throw AppError.conflict("You have already checked in.");
      }

      const updated = await db.registration.update({
        where: { id: reg.id },
        data: {
          checkedInAt: new Date(),
          checkedInById: user.id,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          teamMember: { include: { team: { select: { id: true, name: true } } } },
          hackathon: { select: { id: true, title: true } },
        },
      });

      await db.auditLog.create({
        data: {
          actorId: user.id,
          hackathonId: actualHackathonId,
          action: "registration.checkin",
          entityType: "Registration",
          entityId: reg.id,
          metadata: { method: "DYNAMIC_QR_SCAN", sessionId },
        },
      });

      return updated;
    }

    // 2. Otherwise: Staff-led Check-in (Organizer scanning participant badge or manual check-in)
    await this.getHackathonAndVerifyStaff(user, hackathonId);

    let reg = null;

    if (data.qrToken) {
      try {
        const decoded = jwt.verify(data.qrToken, (env as any).JWT_ACCESS_SECRET || "fallback_secret_for_dev") as any;
        reg = await db.registration.findUnique({
          where: { id: decoded.registrationId },
          include: {
            user: { select: { id: true, name: true, email: true } },
            teamMember: { include: { team: { select: { id: true, name: true } } } },
            hackathon: { select: { id: true, title: true } },
          },
        });
      } catch (err) {
        throw AppError.businessRule("INVALID_STATE", "QR code has expired or is invalid. Please scan again.");
      }
    } else {
      reg = await db.registration.findUnique({
        where: { id: data.registrationId! },
        include: {
          user: { select: { id: true, name: true, email: true } },
          teamMember: { include: { team: { select: { id: true, name: true } } } },
          hackathon: { select: { id: true, title: true } },
        },
      });
    }

    if (!reg || (reg.hackathonId !== actualHackathonId && reg.hackathonId !== hackathonId)) throw AppError.notFound("Registration not found");
    if (reg.status !== "APPROVED") throw AppError.businessRule("INVALID_STATE", "Only APPROVED registrations can check-in.");
    
    if (reg.checkedInAt) {
      throw AppError.conflict("ALREADY_CHECKED_IN");
    }

    return db.registration.update({
      where: { id: reg.id },
      data: {
        checkedInAt: new Date(),
        checkedInById: user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        teamMember: { include: { team: { select: { id: true, name: true } } } },
        hackathon: { select: { id: true, title: true } },
      },
    });
  }

  static async undoCheckIn(user: AuthUser, id: string) {
    const reg = await db.registration.findUnique({ where: { id } });
    if (!reg) throw AppError.notFound("Not found");
    
    const { membership } = await this.getHackathonAndVerifyStaff(user, reg.hackathonId);
    if (membership?.role !== "ADMIN" && membership?.role !== "OWNER") {
      throw AppError.forbidden("Only admins can undo check-ins.");
    }

    return db.registration.update({
      where: { id },
      data: {
        checkedInAt: null,
        checkedInById: null,
      },
    });
  }
}
