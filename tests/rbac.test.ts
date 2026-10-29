import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/lib/db";
import { AdminService } from "@/server/modules/admin/admin.service";
import { StaffService } from "@/server/modules/staff/staff.service";
import { getUserPermissions, assertNotLastSuperAdmin } from "@/server/policies/rbac";
import { can, AuthUser } from "@/server/policies/policy";
import { AppError } from "@/server/lib/errors";

describe("RBAC System - Complete Role & Permission Test Suite", () => {
  let superAdminUser: AuthUser;
  let supportAdminUser: AuthUser;
  let standardUser1: AuthUser;
  let standardUser2: AuthUser;
  let testHackathonId: string;
  let testOrgId: string;

  beforeAll(async () => {
    // 1. Create unique test organization
    const org = await db.organization.create({
      data: {
        name: "RBAC Test University",
        slug: `rbac-test-org-${Date.now()}`,
        status: "ACTIVE",
      },
    });
    testOrgId = org.id;

    // 2. Create test super admin
    const adminRecord = await db.user.create({
      data: {
        email: `rbac-superadmin-${Date.now()}@nexora.app`,
        name: "RBAC Super Admin",
        platformRole: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
    superAdminUser = {
      id: adminRecord.id,
      email: adminRecord.email,
      platformRole: "SUPER_ADMIN",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 3. Create platform support admin
    const supportRecord = await db.user.create({
      data: {
        email: `rbac-support-${Date.now()}@nexora.app`,
        name: "RBAC Support Admin",
        platformRole: "SUPPORT_ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
    supportAdminUser = {
      id: supportRecord.id,
      email: supportRecord.email,
      platformRole: "SUPPORT_ADMIN",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 4. Create standard users
    const u1 = await db.user.create({
      data: {
        email: `rbac-user1-${Date.now()}@nexora.app`,
        name: "RBAC User One",
        platformRole: "USER",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
    standardUser1 = {
      id: u1.id,
      email: u1.email,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    const u2 = await db.user.create({
      data: {
        email: `rbac-user2-${Date.now()}@nexora.app`,
        name: "RBAC User Two",
        platformRole: "USER",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
    standardUser2 = {
      id: u2.id,
      email: u2.email,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 5. Create test hackathon
    const hackathon = await db.hackathon.create({
      data: {
        organizationId: testOrgId,
        createdById: superAdminUser.id,
        title: "RBAC Annual Championship",
        slug: `rbac-annual-${Date.now()}`,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 86400000 * 3),
        status: "PUBLISHED",
      },
    });
    testHackathonId = hackathon.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: superAdminUser.id },
          { hackathonId: testHackathonId },
        ],
      },
    });
    await db.hackathonStaff.deleteMany({ where: { hackathonId: testHackathonId } });
    await db.hackathon.deleteMany({ where: { id: testHackathonId } });
    await db.organization.deleteMany({ where: { id: testOrgId } });
    await db.user.deleteMany({
      where: {
        id: { in: [superAdminUser.id, supportAdminUser.id, standardUser1.id, standardUser2.id] },
      },
    });
  });

  it("Admin can make any user a Judge for a hackathon", async () => {
    // Admin directly assigns user1 as JUDGE
    const assignment = await AdminService.assignRole(superAdminUser, {
      userId: standardUser1.id,
      hackathonId: testHackathonId,
      role: "JUDGE",
    });

    expect(assignment).toBeDefined();
    expect(assignment.status).toBe("ACTIVE");
    expect(assignment.role).toBe("JUDGE");
    expect(assignment.userId).toBe(standardUser1.id);

    // Verify fine-grained permissions for user1 in this hackathon
    const perms = await getUserPermissions(standardUser1, testHackathonId);
    expect(perms.has("judging.evaluate")).toBe(true);
    expect(perms.has("hackathon.read")).toBe(true);
    // Judge cannot manage staff or publish results
    expect(perms.has("hackathon.staff.manage")).toBe(false);
    expect(perms.has("results.publish")).toBe(false);

    // Verify audit log
    const audit = await db.auditLog.findFirst({
      where: {
        actorId: superAdminUser.id,
        hackathonId: testHackathonId,
        action: "role.assign",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeDefined();
    expect((audit?.metadata as any)?.role).toBe("JUDGE");
  });

  it("Admin can make any user an Organizer for a hackathon", async () => {
    // Admin assigns user2 as ORGANIZER
    const assignment = await AdminService.assignRole(superAdminUser, {
      userId: standardUser2.id,
      hackathonId: testHackathonId,
      role: "ORGANIZER",
    });

    expect(assignment).toBeDefined();
    expect(assignment.status).toBe("ACTIVE");
    expect(assignment.role).toBe("ORGANIZER");
    expect(assignment.userId).toBe(standardUser2.id);

    // Verify organizer permissions
    const perms = await getUserPermissions(standardUser2, testHackathonId);
    expect(perms.has("hackathon.update")).toBe(true);
    expect(perms.has("hackathon.publish")).toBe(true);
    expect(perms.has("hackathon.staff.manage")).toBe(true);
    expect(perms.has("registration.review")).toBe(true);
    expect(perms.has("judging.assign")).toBe(true);
    expect(perms.has("results.publish")).toBe(true);
    expect(perms.has("prize.manage")).toBe(true);

    // Can policy check passes
    expect(can(standardUser2, "hackathon:update", { hackathonRole: "ORGANIZER" })).toBe(true);
    expect(can(standardUser2, "hackathon:manage_staff", { hackathonRole: "ORGANIZER" })).toBe(true);
  });

  it("Admin can revoke any role from a user", async () => {
    // Revoke judge role from user1
    const result = await AdminService.revokeRole(superAdminUser, {
      userId: standardUser1.id,
      hackathonId: testHackathonId,
      role: "JUDGE",
    });

    expect(result.success).toBe(true);

    // Verify permissions are gone
    const perms = await getUserPermissions(standardUser1, testHackathonId);
    expect(perms.has("judging.evaluate")).toBe(false);

    // Verify audit log
    const audit = await db.auditLog.findFirst({
      where: {
        actorId: superAdminUser.id,
        hackathonId: testHackathonId,
        action: "role.revoke",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeDefined();
  });

  it("Enforces safeguard against demoting or suspending the last Super Admin", async () => {
    // Count active super admins
    const superAdminCount = await db.user.count({
      where: { platformRole: "SUPER_ADMIN", status: "ACTIVE" },
    });

    // If there is only one super admin or when targeting the last one:
    if (superAdminCount === 1) {
      await expect(
        assertNotLastSuperAdmin(superAdminUser.id, "USER")
      ).rejects.toThrow(AppError);

      await expect(
        assertNotLastSuperAdmin(superAdminUser.id, undefined, "SUSPENDED")
      ).rejects.toThrow(AppError);
    } else {
      // Create a temporary isolated super admin and test
      const tempAdmin = await db.user.create({
        data: {
          email: `temp-admin-${Date.now()}@nexora.app`,
          name: "Temp Admin",
          platformRole: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      });

      // It succeeds because there are 2+ super admins
      await expect(
        AdminService.updatePlatformRole(superAdminUser, tempAdmin.id, { platformRole: "USER" })
      ).resolves.toBeDefined();

      await db.user.delete({ where: { id: tempAdmin.id } });
    }
  });

  it("Enforces Event Isolation: permissions in Hackathon A do not leak into Hackathon B", async () => {
    // Create Hackathon B
    const hackathonB = await db.hackathon.create({
      data: {
        organizationId: testOrgId,
        createdById: superAdminUser.id,
        title: "Another Unrelated Hackathon",
        slug: `hackathon-b-${Date.now()}`,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 86400000 * 2),
        status: "PUBLISHED",
      },
    });

    try {
      // user2 is Organizer on testHackathonId, but NOT on hackathonB
      const permsB = await getUserPermissions(standardUser2, hackathonB.id);
      expect(permsB.has("hackathon.update")).toBe(false);
      expect(permsB.has("hackathon.publish")).toBe(false);
      expect(permsB.has("judging.assign")).toBe(false);
    } finally {
      await db.hackathon.delete({ where: { id: hackathonB.id } });
    }
  });

  it("Prevents privilege escalation: non-admin cannot assign roles or update platform roles", async () => {
    await expect(
      AdminService.assignRole(standardUser1, {
        userId: standardUser2.id,
        hackathonId: testHackathonId,
        role: "ORGANIZER",
      })
    ).rejects.toThrow(AppError);

    await expect(
      AdminService.updatePlatformRole(standardUser1, standardUser1.id, {
        platformRole: "SUPER_ADMIN",
      })
    ).rejects.toThrow(AppError);
  });

  it("Support Admin can view users and queue, but cannot access scoring rubrics or modify platform roles", async () => {
    const queue = await AdminService.getSupportQueue(supportAdminUser);
    expect(queue).toBeDefined();
    expect(queue.recentUsers).toBeDefined();

    // Support admin cannot change platform roles
    await expect(
      AdminService.updatePlatformRole(supportAdminUser, standardUser1.id, {
        platformRole: "SUPER_ADMIN",
      })
    ).rejects.toThrow(AppError);

    // Support admin cannot assign judges
    await expect(
      AdminService.assignRole(supportAdminUser, {
        userId: standardUser1.id,
        hackathonId: testHackathonId,
        role: "JUDGE",
      })
    ).rejects.toThrow(AppError);
  });
});
