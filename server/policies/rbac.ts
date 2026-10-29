import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { PlatformRole, HackathonStaffRole, OrgRole } from "@prisma/client";
import {
  SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PermissionDefinition,
} from "@/lib/rbac-definitions";

export { SYSTEM_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS };
export type { PermissionDefinition };

// ============================================================
// SEED / SYNC ROLES & PERMISSIONS
// ============================================================

export async function syncRbacDefinitions() {
  for (const perm of SYSTEM_PERMISSIONS) {
    await db.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, category: perm.category, description: perm.description },
      create: {
        code: perm.code,
        name: perm.name,
        category: perm.category,
        description: perm.description,
      },
    });
  }

  const allDbPermissions = await db.permission.findMany();
  const permMap = new Map(allDbPermissions.map((p) => [p.code, p.id]));

  for (const [roleCode, permCodes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const isPlatform = roleCode === "SUPER_ADMIN" || roleCode === "SUPPORT_ADMIN";
    const role = await db.role.upsert({
      where: { code: roleCode },
      update: {
        name: roleCode.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        scope: isPlatform ? "PLATFORM" : "EVENT",
      },
      create: {
        code: roleCode,
        name: roleCode.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        scope: isPlatform ? "PLATFORM" : "EVENT",
        description: `Standard system role: ${roleCode}`,
      },
    });

    for (const code of permCodes) {
      const permissionId = permMap.get(code);
      if (permissionId) {
        await db.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId } },
          update: {},
          create: { roleId: role.id, permissionId },
        });
      }
    }
  }
}

// ============================================================
// SAFEGUARD: LAST SUPER ADMIN PROTECTION
// ============================================================

export async function assertNotLastSuperAdmin(targetUserId: string, newRole?: PlatformRole, newStatus?: string) {
  // Check if target is a super admin
  const user = await db.user.findUnique({
    where: { id: targetUserId },
    select: { platformRole: true, status: true },
  });

  if (!user || user.platformRole !== "SUPER_ADMIN") {
    return;
  }

  // If role is changing away from SUPER_ADMIN or status is changing to SUSPENDED:
  const isDemoting = newRole !== undefined && newRole !== "SUPER_ADMIN";
  const isSuspending = newStatus === "SUSPENDED";

  if (isDemoting || isSuspending) {
    const activeSuperAdminCount = await db.user.count({
      where: {
        platformRole: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });

    if (activeSuperAdminCount <= 1) {
      throw AppError.businessRule(
        "LAST_SUPER_ADMIN",
        "Cannot demote or suspend the last active Super Admin. Assign another Super Admin first."
      );
    }
  }
}

// ============================================================
// PERMISSION CHECKING CORE
// ============================================================

export interface UserContext {
  id: string;
  email: string;
  platformRole: PlatformRole;
  status: "ACTIVE" | "SUSPENDED";
  emailVerified: boolean;
}

export async function getUserPermissions(user: UserContext | null, hackathonId?: string): Promise<Set<string>> {
  const permissions = new Set<string>();

  if (!user || user.status === "SUSPENDED") {
    return permissions;
  }

  // 1. Super admin has everything
  if (user.platformRole === "SUPER_ADMIN") {
    SYSTEM_PERMISSIONS.forEach((p) => permissions.add(p.code));
    return permissions;
  }

  // 2. Platform Support Admin
  if (user.platformRole === "SUPPORT_ADMIN") {
    (DEFAULT_ROLE_PERMISSIONS.SUPPORT_ADMIN || []).forEach((p) => permissions.add(p));
  }

  // 3. Hackathon-specific roles
  if (hackathonId) {
    // Check if user is Org OWNER or ADMIN for the organization hosting this hackathon
    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      select: { organizationId: true },
    });

    if (hackathon) {
      const orgMember = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
      });

      if (orgMember?.role === "OWNER" || orgMember?.role === "ADMIN") {
        (DEFAULT_ROLE_PERMISSIONS.ORGANIZER || []).forEach((p) => permissions.add(p));
      } else if (orgMember?.role === "STAFF") {
        permissions.add("hackathon.read");
      }
    }

    // Check staff roles for this hackathon
    const staffEntries = await db.hackathonStaff.findMany({
      where: {
        hackathonId,
        userId: user.id,
        status: "ACTIVE",
      },
    });

    for (const staff of staffEntries) {
      const rolePerms = DEFAULT_ROLE_PERMISSIONS[staff.role] || [];
      rolePerms.forEach((p) => permissions.add(p));
    }
  }

  return permissions;
}

export async function hasPermission(
  user: UserContext | null,
  permissionCode: string,
  context?: { hackathonId?: string; orgId?: string }
): Promise<boolean> {
  if (!user || user.status === "SUSPENDED") {
    return false;
  }

  if (user.platformRole === "SUPER_ADMIN") {
    return true;
  }

  const perms = await getUserPermissions(user, context?.hackathonId);
  return perms.has(permissionCode);
}
