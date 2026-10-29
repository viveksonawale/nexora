import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../server/lib/db";
import { AttendanceService } from "../server/modules/attendance/attendance.service";
import {
  generateAttendanceToken,
  ROTATION_WINDOW_MS,
  computeWindow,
} from "../server/modules/attendance/attendance-crypto";
import { AuthUser } from "../server/policies/policy";
import crypto from "crypto";

describe("QR Attendance Flow Specification Tests", () => {
  let orgAId: string;
  let orgBId: string;
  let organizerA: AuthUser;
  let organizerB: AuthUser; // Wrong organizer
  let approvedStudent: AuthUser;
  let pendingStudent: AuthUser;
  let manualStudent: AuthUser;

  let hackathonAId: string;
  let approvedRegId: string;
  let pendingRegId: string;
  let manualRegId: string;

  beforeAll(async () => {
    // 1. Create Organizer A (College Org A)
    const uOrgA = await db.user.create({
      data: {
        email: `organizer_a_${Date.now()}@example.com`,
        name: "Lead Organizer A",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    organizerA = {
      id: uOrgA.id,
      email: uOrgA.email,
      name: uOrgA.name,
      platformRole: uOrgA.platformRole,
      emailVerified: true,
      status: uOrgA.status,
    };

    // 2. Create Wrong Organizer B (Different College Org B)
    const uOrgB = await db.user.create({
      data: {
        email: `organizer_b_${Date.now()}@example.com`,
        name: "Wrong Organizer B",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    organizerB = {
      id: uOrgB.id,
      email: uOrgB.email,
      name: uOrgB.name,
      platformRole: uOrgB.platformRole,
      emailVerified: true,
      status: uOrgB.status,
    };

    // 3. Create Approved Student
    const uApp = await db.user.create({
      data: {
        email: `app_student_${Date.now()}@example.com`,
        name: "Approved Student",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    approvedStudent = {
      id: uApp.id,
      email: uApp.email,
      name: uApp.name,
      platformRole: uApp.platformRole,
      emailVerified: true,
      status: uApp.status,
    };

    // 4. Create Pending (Unapproved) Student
    const uPen = await db.user.create({
      data: {
        email: `pen_student_${Date.now()}@example.com`,
        name: "Pending Student",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    pendingStudent = {
      id: uPen.id,
      email: uPen.email,
      name: uPen.name,
      platformRole: uPen.platformRole,
      emailVerified: true,
      status: uPen.status,
    };

    // 5. Create Second Approved Student (for manual marking test)
    const uMan = await db.user.create({
      data: {
        email: `man_student_${Date.now()}@example.com`,
        name: "Manual Mark Student",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    manualStudent = {
      id: uMan.id,
      email: uMan.email,
      name: uMan.name,
      platformRole: uMan.platformRole,
      emailVerified: true,
      status: uMan.status,
    };

    // Organizations
    const orgA = await db.organization.create({
      data: {
        name: "College A",
        slug: `col-a-${Date.now()}`,
        status: "ACTIVE",
        members: { create: { userId: organizerA.id, role: "ADMIN" } },
      },
    });
    orgAId = orgA.id;

    const orgB = await db.organization.create({
      data: {
        name: "College B",
        slug: `col-b-${Date.now()}`,
        status: "ACTIVE",
        members: { create: { userId: organizerB.id, role: "ADMIN" } },
      },
    });
    orgBId = orgB.id;

    // Create Hackathon in LIVE status
    const hack = await db.hackathon.create({
      data: {
        organizationId: orgAId,
        createdById: organizerA.id,
        title: "Live Hackathon Event",
        slug: `live-hack-${Date.now()}`,
        mode: "OFFLINE",
        status: "LIVE",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000),
      },
    });
    hackathonAId = hack.id;

    // Registrations
    const r1 = await db.registration.create({
      data: {
        hackathonId: hackathonAId,
        userId: approvedStudent.id,
        status: "APPROVED",
        qrToken: `reg_qr_1_${Date.now()}`,
      },
    });
    approvedRegId = r1.id;

    const r2 = await db.registration.create({
      data: {
        hackathonId: hackathonAId,
        userId: pendingStudent.id,
        status: "PENDING",
        qrToken: `reg_qr_2_${Date.now()}`,
      },
    });
    pendingRegId = r2.id;

    const r3 = await db.registration.create({
      data: {
        hackathonId: hackathonAId,
        userId: manualStudent.id,
        status: "APPROVED",
        qrToken: `reg_qr_3_${Date.now()}`,
      },
    });
    manualRegId = r3.id;
  });

  afterAll(async () => {
    try {
      if (hackathonAId) {
        await db.attendanceRecord.deleteMany({ where: { session: { hackathonId: hackathonAId } } });
        await db.attendanceSession.deleteMany({ where: { hackathonId: hackathonAId } });
        await db.registration.deleteMany({ where: { hackathonId: hackathonAId } });
        await db.notification.deleteMany({ where: { userId: { in: [approvedStudent.id, pendingStudent.id, manualStudent.id] } } });
        await db.hackathon.delete({ where: { id: hackathonAId } });
      }
      if (orgAId) await db.organization.delete({ where: { id: orgAId } });
      if (orgBId) await db.organization.delete({ where: { id: orgBId } });
      const userIds = [organizerA?.id, organizerB?.id, approvedStudent?.id, pendingStudent?.id, manualStudent?.id].filter(Boolean);
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    } catch {}
  });

  // =========================================================================
  // 1. NON-ORGANIZER ACCESS CONTROL
  // =========================================================================
  it("non-organizer cannot start a session", async () => {
    await expect(
      AttendanceService.startSession(approvedStudent, hackathonAId)
    ).rejects.toThrow(/Organizer permissions required/);
  });

  it("wrong organizer gets 403 when attempting to start a session", async () => {
    await expect(
      AttendanceService.startSession(organizerB, hackathonAId)
    ).rejects.toThrow(/Organizer permissions required/);
  });

  // =========================================================================
  // 2. SESSION LIFECYCLE & DISPLAY KEY GENERATION
  // =========================================================================
  let activeSessionId: string;
  let activeDisplayKey: string;
  let activeSecret: string;

  it("organizer starts session: returns display key once and notifies APPROVED registrants", async () => {
    const result = await AttendanceService.startSession(organizerA, hackathonAId, "Main Stage Track");
    expect(result.session.id).toBeDefined();
    expect(result.session.status).toBe("ACTIVE");
    expect(result.displayKey).toBeDefined();
    expect(result.displayKey.length).toBe(64); // 32 bytes hex = 64 characters
    expect(result.displayLink).toContain(result.displayKey);

    activeSessionId = result.session.id;
    activeDisplayKey = result.displayKey;

    // Verify secret is NOT returned in result
    expect((result as any).secret).toBeUndefined();
    expect((result.session as any).secret).toBeUndefined();

    // Verify secret in DB is stored
    const dbSession = await db.attendanceSession.findUnique({ where: { id: activeSessionId } });
    expect(dbSession?.secret).toBeDefined();
    activeSecret = dbSession!.secret;

    // Verify display key is NOT stored in plain text in DB
    expect(dbSession?.displayKeyHash).not.toBe(activeDisplayKey);
    const expectedHash = crypto.createHash("sha256").update(activeDisplayKey).digest("hex");
    expect(dbSession?.displayKeyHash).toBe(expectedHash);

    // Verify Notifications were created for approved registrants with scanner link
    const notifs = await db.notification.findMany({
      where: { userId: approvedStudent.id },
    });
    expect(notifs.length).toBeGreaterThan(0);
    expect(notifs[0].link).toBe(`/hackathons/${hackathonAId}/check-in`);
  });

  // =========================================================================
  // 3. DISPLAY LINK SECURITY & ROSTER ISOLATION
  // =========================================================================
  it("non-organizer cannot open the display link or read the attendance list", async () => {
    await expect(
      AttendanceService.verifyDisplayAccess(approvedStudent, activeDisplayKey)
    ).rejects.toThrow(/Organizer permissions required/);

    await expect(
      AttendanceService.listAttendance(approvedStudent, hackathonAId, activeSessionId)
    ).rejects.toThrow(/Organizer permissions required/);
  });

  it("wrong organizer gets 403 when opening display link or reading list", async () => {
    await expect(
      AttendanceService.verifyDisplayAccess(organizerB, activeDisplayKey)
    ).rejects.toThrow(/Organizer permissions required/);

    await expect(
      AttendanceService.listAttendance(organizerB, hackathonAId, activeSessionId)
    ).rejects.toThrow(/Organizer permissions required/);
  });

  it("display page response contains strictly NO student names or lists", async () => {
    const accessData = await AttendanceService.verifyDisplayAccess(organizerA, activeDisplayKey);
    expect(accessData.session).toBeDefined();
    expect(accessData.checkedInCount).toBe(0);
    expect((accessData as any).students).toBeUndefined();
    expect((accessData as any).present).toBeUndefined();
    expect((accessData as any).absent).toBeUndefined();

    const tokenData = await AttendanceService.getDisplayToken(activeDisplayKey);
    expect(tokenData.status).toBe("ACTIVE");
    expect(tokenData.token).toBeDefined();
    expect(tokenData.checkedInCount).toBe(0);
    expect((tokenData as any).students).toBeUndefined();
    expect((tokenData as any).present).toBeUndefined();
  });

  it("regenerate display link invalidates the old display key", async () => {
    const regenResult = await AttendanceService.regenerateDisplayKey(organizerA, hackathonAId, activeSessionId);
    expect(regenResult.displayKey).not.toBe(activeDisplayKey);

    // Old key must now fail with 403 Forbidden
    await expect(
      AttendanceService.verifyDisplayAccess(organizerA, activeDisplayKey)
    ).rejects.toThrow(/Access denied/);

    // New key must succeed
    const newAccess = await AttendanceService.verifyDisplayAccess(organizerA, regenResult.displayKey);
    expect(newAccess.session.id).toBe(activeSessionId);

    activeDisplayKey = regenResult.displayKey;
  });

  // =========================================================================
  // 4. TOKEN ROTATION, GRACE PERIOD & SCAN VALIDATION
  // =========================================================================
  it("expired token older than previous window fails", async () => {
    const now = Date.now();
    const expiredTimestamp = now - ROTATION_WINDOW_MS * 3; // 3 windows in the past
    const { token: expiredToken } = generateAttendanceToken(activeSessionId, activeSecret, expiredTimestamp);

    await expect(
      AttendanceService.scanAttendanceToken(approvedStudent, hackathonAId, expiredToken)
    ).rejects.toThrow(/expired/);
  });

  it("token from previous window within grace passes", async () => {
    const now = Date.now();
    const prevWindowTimestamp = now - ROTATION_WINDOW_MS; // Exactly previous window W0 - 1
    const { token: graceToken } = generateAttendanceToken(activeSessionId, activeSecret, prevWindowTimestamp);

    const result = await AttendanceService.scanAttendanceToken(approvedStudent, hackathonAId, graceToken);
    expect(result.success).toBe(true);
    expect(result.alreadyMarked).toBe(false);
    expect(result.record.method).toBe("QR");

    // Verify in database
    const dbRecord = await db.attendanceRecord.findUnique({
      where: { sessionId_userId: { sessionId: activeSessionId, userId: approvedStudent.id } },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.method).toBe("QR");
  });

  it("duplicate scan is idempotent and returns already marked", async () => {
    const { token: currentToken } = generateAttendanceToken(activeSessionId, activeSecret, Date.now());

    const result = await AttendanceService.scanAttendanceToken(approvedStudent, hackathonAId, currentToken);
    expect(result.success).toBe(true);
    expect(result.alreadyMarked).toBe(true);
    expect(result.message).toBe("already marked");

    // Ensure no second record was created
    const count = await db.attendanceRecord.count({
      where: { sessionId: activeSessionId, userId: approvedStudent.id },
    });
    expect(count).toBe(1);
  });

  it("unapproved student fails check-in", async () => {
    const { token: currentToken } = generateAttendanceToken(activeSessionId, activeSecret, Date.now());

    await expect(
      AttendanceService.scanAttendanceToken(pendingStudent, hackathonAId, currentToken)
    ).rejects.toThrow(/Only APPROVED participants/);
  });

  // =========================================================================
  // 5. MANUAL MARKING & AUDIT (IDEMPOTENT)
  // =========================================================================
  it("manual mark is idempotent and records markedBy", async () => {
    const manualResult = await AttendanceService.manualMark(
      organizerA,
      hackathonAId,
      activeSessionId,
      manualStudent.id
    );
    expect(manualResult.success).toBe(true);
    expect(manualResult.alreadyMarked).toBe(false);
    expect(manualResult.record.method).toBe("MANUAL");
    expect(manualResult.record.markedBy?.name).toBe("Lead Organizer A");

    // Re-marking manually must be idempotent
    const duplicateManual = await AttendanceService.manualMark(
      organizerA,
      hackathonAId,
      activeSessionId,
      manualStudent.id
    );
    expect(duplicateManual.success).toBe(true);
    expect(duplicateManual.alreadyMarked).toBe(true);

    // Verify count in database is still 1
    const count = await db.attendanceRecord.count({
      where: { sessionId: activeSessionId, userId: manualStudent.id },
    });
    expect(count).toBe(1);
  });

  // =========================================================================
  // 6. PAUSED AND ENDED SESSIONS REJECT SCANS
  // =========================================================================
  it("paused session rejects scans", async () => {
    await AttendanceService.updateSessionStatus(organizerA, hackathonAId, activeSessionId, "PAUSED");

    const { token: currentToken } = generateAttendanceToken(activeSessionId, activeSecret, Date.now());

    await expect(
      AttendanceService.scanAttendanceToken(manualStudent, hackathonAId, currentToken)
    ).rejects.toThrow(/There is no active attendance session/);
  });

  it("ended session rejects scans", async () => {
    await AttendanceService.updateSessionStatus(organizerA, hackathonAId, activeSessionId, "ENDED");

    const { token: currentToken } = generateAttendanceToken(activeSessionId, activeSecret, Date.now());

    await expect(
      AttendanceService.scanAttendanceToken(manualStudent, hackathonAId, currentToken)
    ).rejects.toThrow(/There is no active attendance session/);
  });

  // =========================================================================
  // 7. ATTENDANCE ROSTER ACCURACY
  // =========================================================================
  it("organizer lists attendance with present and absent students accurately", async () => {
    const list = await AttendanceService.listAttendance(organizerA, hackathonAId, activeSessionId);
    expect(list.metrics.totalApproved).toBe(2); // approvedStudent and manualStudent
    expect(list.metrics.presentCount).toBe(2);
    expect(list.metrics.absentCount).toBe(0);

    const presentUserIds = list.present.map((p) => p.userId);
    expect(presentUserIds).toContain(approvedStudent.id);
    expect(presentUserIds).toContain(manualStudent.id);
  });
});
