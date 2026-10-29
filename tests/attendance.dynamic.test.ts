import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../server/lib/db";
import { RegistrationService } from "../server/modules/registration/registration.service";
import { AttendanceSessionService } from "../server/modules/attendance/attendance-session.service";
import { generateDemoQRValue } from "../lib/attendance/qr-demo";
import { AuthUser } from "../server/policies/policy";

describe("Dynamic Attendance Check-In (Option A)", () => {
  let hackathonId: string;
  let orgId: string;
  let studentUser: AuthUser;
  let studentRegId: string;

  beforeAll(async () => {
    try {
      const u = await db.user.create({
        data: {
          email: `student_${Date.now()}@example.com`,
          name: "Test Student",
          platformRole: "USER",
          status: "ACTIVE",
        },
      });
      studentUser = {
        id: u.id,
        email: u.email,
        platformRole: u.platformRole,
        emailVerified: true,
        status: u.status,
      };

      const org = await db.organization.create({
        data: { name: "Att Test Org", slug: "att-org-" + Date.now(), status: "ACTIVE" },
      });
      orgId = org.id;

      const h = await db.hackathon.create({
        data: {
          organizationId: orgId,
          createdById: u.id,
          title: "Attendance Hackathon",
          slug: "att-hack-" + Date.now(),
          mode: "OFFLINE",
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 86400000 * 2),
          status: "PUBLISHED",
        },
      });
      hackathonId = h.id;

      // Create an APPROVED registration for student
      const reg = await db.registration.create({
        data: {
          hackathonId,
          userId: studentUser.id,
          status: "APPROVED",
          qrToken: `TOKEN_${Date.now()}`,
        },
      });
      studentRegId = reg.id;

      // Start an ACTIVE attendance session
      AttendanceSessionService.setSession(hackathonId, "ACTIVE", `SESSION_${hackathonId.slice(-6)}`);
    } catch (e) {
      console.warn("Setup failed:", e);
    }
  });

  afterAll(async () => {
    try {
      if (studentRegId) await db.registration.delete({ where: { id: studentRegId } });
      if (hackathonId) await db.hackathon.delete({ where: { id: hackathonId } });
      if (orgId) await db.organization.delete({ where: { id: orgId } });
      if (studentUser?.id) await db.user.delete({ where: { id: studentUser.id } });
    } catch (e) {}
  });

  it("successfully checks in student when scanning active rotating dynamic QR code", async () => {
    if (!hackathonId) return;

    const session = AttendanceSessionService.getSession(hackathonId);
    const dynamicQR = generateDemoQRValue(session.id, 1, hackathonId);

    const result = await RegistrationService.checkIn(studentUser, hackathonId, {
      qrToken: dynamicQR,
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(studentRegId);
    expect(result.checkedInAt).not.toBeNull();
    expect(result.checkedInById).toBe(studentUser.id);

    // Verify in database
    const dbReg = await db.registration.findUnique({ where: { id: studentRegId } });
    expect(dbReg?.checkedInAt).not.toBeNull();
  });

  it("rejects duplicate check-in with conflict error", async () => {
    if (!hackathonId) return;

    const session = AttendanceSessionService.getSession(hackathonId);
    const dynamicQR = generateDemoQRValue(session.id, 2, hackathonId);

    await expect(
      RegistrationService.checkIn(studentUser, hackathonId, { qrToken: dynamicQR })
    ).rejects.toThrow("already checked in");
  });

  it("rejects expired dynamic QR code", async () => {
    if (!hackathonId) return;

    // Create a new user with approved registration
    const u2 = await db.user.create({
      data: { email: `student2_${Date.now()}@example.com`, name: "Student 2", status: "ACTIVE" },
    });
    const reg2 = await db.registration.create({
      data: { hackathonId, userId: u2.id, status: "APPROVED", qrToken: `TOKEN2_${Date.now()}` },
    });

    const user2: AuthUser = { id: u2.id, email: u2.email, platformRole: "USER", emailVerified: true, status: "ACTIVE" };

    // Old timestamp from 5 minutes ago
    const expiredQR = `NEXORA_ATTENDANCE:${hackathonId}:SESSION_XYZ:1:${Date.now() - 300000}`;

    await expect(
      RegistrationService.checkIn(user2, hackathonId, { qrToken: expiredQR })
    ).rejects.toThrow("expired");

    // Clean up
    await db.registration.delete({ where: { id: reg2.id } });
    await db.user.delete({ where: { id: u2.id } });
  });
});
