import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../server/lib/db";
import { RegistrationService } from "../server/modules/registration/registration.service";
import { AuthUser } from "../server/policies/policy";
import crypto from "crypto";

describe("Registration Service - Concurrency", () => {
  let hackathonId: string;
  let orgId: string;
  let admin: AuthUser;

  beforeAll(async () => {
    // Attempt to seed data for test if DB is available
    try {
      const u = await db.user.create({
        data: { email: `testadmin_${Date.now()}@example.com`, name: "Admin", role: "ADMIN" }
      });
      admin = { id: u.id, email: u.email, role: u.role };

      const org = await db.organization.create({
        data: { name: "Test Org", slug: "test-org-" + Date.now(), status: "APPROVED" }
      });
      orgId = org.id;

      const h = await db.hackathon.create({
        data: {
          organizationId: orgId,
          title: "10 Seat Hackathon",
          slug: "10-seat-" + Date.now(),
          mode: "ONLINE",
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 86400000 * 2),
          timezone: "UTC",
          maxParticipants: 10,
          status: "PUBLISHED"
        }
      });
      hackathonId = h.id;
    } catch (e) {
      console.warn("DB setup failed, test might skip or fail", e);
    }
  });

  afterAll(async () => {
    try {
      if (orgId) await db.organization.delete({ where: { id: orgId } });
      if (admin?.id) await db.user.delete({ where: { id: admin.id } });
    } catch (e) {}
  });

  it("50 parallel registrations on a 10-seat hackathon produce exactly 10 APPROVED", async () => {
    if (!hackathonId) return; // Skip if db not available

    // Create 50 users
    const users = await Promise.all(
      Array.from({ length: 50 }).map((_, i) =>
        db.user.create({
          data: { email: `user${i}_${Date.now()}@example.com`, name: `User ${i}`, role: "USER" }
        })
      )
    );

    // Fire 50 registrations concurrently
    const promises = users.map(u => {
      const authUser: AuthUser = { id: u.id, email: u.email, role: u.role };
      return RegistrationService.register(authUser, hackathonId, { answers: {} }).catch(e => e); // catch errors so Promise.all doesn't fail fast
    });

    await Promise.all(promises);

    // Verify exactly 10 are APPROVED
    const approvedCount = await db.registration.count({
      where: { hackathonId, status: "APPROVED" }
    });
    const waitlistedCount = await db.registration.count({
      where: { hackathonId, status: "WAITLISTED" }
    });

    expect(approvedCount).toBe(10);
    // Depending on timing, some might have failed or waitlisted. But exactly 10 MUST be APPROVED.
    expect(approvedCount + waitlistedCount).toBeLessThanOrEqual(50);
  }, 30000); // 30s timeout
});
