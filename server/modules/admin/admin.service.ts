import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser } from "@/server/policies/policy";
import { OrganizationStatus, UserStatus, PlatformRole, HackathonStatus } from "@prisma/client";
import { z } from "zod";
import {
  QueryOrganizationsSchema,
  QueryUsersSchema,
  CreateSkillSchema,
  UpdateSkillSchema,
  UpdatePlatformRoleSchema,
  AdminAssignRoleSchema,
  AdminRevokeRoleSchema,
  AdminCreateUserSchema,
  AdminUpdateUserSchema,
  AdminCreateHackathonSchema,
  AdminUpdateHackathonSchema,
} from "./admin.schemas";
import { slugify } from "@/server/utils/slugify";
import { queueEmail } from "@/server/modules/email/email.service";
import { hashPassword } from "@/server/modules/auth/password";
import {
  assertNotLastSuperAdmin,
  syncRbacDefinitions,
  SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from "@/server/policies/rbac";
import { StaffService } from "@/server/modules/staff/staff.service";

export class AdminService {
  private static ensureSuperAdmin(user: AuthUser) {
    if (user.platformRole !== "SUPER_ADMIN") {
      throw AppError.forbidden("Super Admin access required.");
    }
  }

  // --- Organizations ---

  static async getOrganizations(user: AuthUser, query: z.infer<typeof QueryOrganizationsSchema>) {
    this.ensureSuperAdmin(user);

    const where = query.status ? { status: query.status } : {};
    return db.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  static async approveOrganization(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);

    const org = await db.organization.findUnique({
      where: { id },
      include: {
        members: {
          where: { role: "OWNER" },
          include: { user: true },
        },
      },
    });

    if (!org) throw AppError.notFound("Organization not found.");
    if (org.status === OrganizationStatus.ACTIVE) throw AppError.badRequest("Already active.");

    const updated = await db.organization.update({
      where: { id },
      data: { status: OrganizationStatus.ACTIVE },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        organizationId: id,
        action: "organization.approve",
        entityType: "Organization",
        entityId: id,
      },
    });

    // Notify owner(s)
    for (const member of org.members) {
      if (member.user.email) {
        // Queue an email notification using outbox pattern
        // In reality, this would just send an email using outbox table
        await queueEmail({
          toEmail: member.user.email,
          template: "notification",
          payload: {
            orgName: org.name,
          },
        });
      }
    }

    return updated;
  }

  static async suspendOrganization(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);

    const updated = await db.organization.update({
      where: { id },
      data: { status: OrganizationStatus.SUSPENDED },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        organizationId: id,
        action: "organization.suspend",
        entityType: "Organization",
        entityId: id,
      },
    });

    return updated;
  }

  static async deleteOrganization(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);

    const existing = await db.organization.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Organization not found.");

    await db.$transaction(async (tx) => {
      await tx.organizationMember.deleteMany({ where: { organizationId: id } });
      const hackathons = await tx.hackathon.findMany({ where: { organizationId: id }, select: { id: true } });
      for (const h of hackathons) {
        await tx.registration.deleteMany({ where: { hackathonId: h.id } });
        await tx.hackathonStaff.deleteMany({ where: { hackathonId: h.id } });
        await tx.hackathon.delete({ where: { id: h.id } });
      }
      await tx.organization.delete({ where: { id } });
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "organization.delete",
        entityType: "Organization",
        entityId: id,
        metadata: { name: existing.name },
      },
    });

    return { success: true, id };
  }

  // --- Users & RBAC ---

  static async getUsers(user: AuthUser, query: z.infer<typeof QueryUsersSchema>) {
    if (user.platformRole !== "SUPER_ADMIN" && user.platformRole !== "SUPPORT_ADMIN") {
      throw AppError.forbidden("Admin access required.");
    }

    const where = query.q
      ? {
          OR: [
            { email: { contains: query.q, mode: "insensitive" as any } },
            { name: { contains: query.q, mode: "insensitive" as any } },
          ],
        }
      : {};

    return db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        profile: {
          select: {
            avatarUrl: true,
            headline: true,
            completenessScore: true,
          },
        },
        staffRoles: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        orgMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  static async createUser(user: AuthUser, data: z.infer<typeof AdminCreateUserSchema>) {
    this.ensureSuperAdmin(user);

    const existing = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw AppError.conflict("A user with this email address already exists.");
    }

    const passwordHash = await hashPassword(data.password);
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    let counter = 1;
    while (await db.profile.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const newUser = await db.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        platformRole: data.platformRole,
        status: data.status,
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            slug,
            headline: "Member",
            onboardingCompleted: true,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.create",
        entityType: "User",
        entityId: newUser.id,
        metadata: {
          email: newUser.email,
          platformRole: newUser.platformRole,
        },
      },
    });

    return newUser;
  }

  static async updateUser(user: AuthUser, id: string, data: z.infer<typeof AdminUpdateUserSchema>) {
    this.ensureSuperAdmin(user);

    const existing = await db.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!existing) {
      throw AppError.notFound("User not found.");
    }

    if (data.platformRole && data.platformRole !== existing.platformRole) {
      await assertNotLastSuperAdmin(id, data.platformRole);
    }

    if (data.status === "SUSPENDED" && existing.status !== "SUSPENDED") {
      if (user.id === id) {
        throw AppError.badRequest("Cannot suspend your own account.");
      }
      await assertNotLastSuperAdmin(id, undefined, "SUSPENDED");
    }

    if (data.email && data.email.toLowerCase() !== existing.email) {
      const emailTaken = await db.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (emailTaken && emailTaken.id !== id) {
        throw AppError.conflict("Email address already in use by another user.");
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        email: data.email ? data.email.toLowerCase() : undefined,
        platformRole: data.platformRole ?? undefined,
        status: data.status ?? undefined,
        profile: data.headline !== undefined ? {
          upsert: {
            create: {
              slug: slugify(data.name || existing.name) + "-" + Date.now().toString(36),
              headline: data.headline,
            },
            update: {
              headline: data.headline,
            },
          },
        } : undefined,
      },
      include: {
        profile: true,
        staffRoles: {
          include: {
            hackathon: {
              select: { id: true, title: true, slug: true },
            },
          },
        },
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.update",
        entityType: "User",
        entityId: id,
        metadata: {
          changes: data,
        },
      },
    });

    return updated;
  }

  static async deleteUser(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);

    if (user.id === id) {
      throw AppError.badRequest("You cannot delete your own administrative account.");
    }

    const existing = await db.user.findUnique({
      where: { id },
    });
    if (!existing) {
      throw AppError.notFound("User not found.");
    }

    await assertNotLastSuperAdmin(id, "USER");

    // Clean up dependent records in a safe transaction
    await db.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.emailToken.deleteMany({ where: { userId: id } });
      await tx.oAuthAccount.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.hackathonStaff.deleteMany({ where: { userId: id } });
      await tx.organizationMember.deleteMany({ where: { userId: id } });
      await tx.registration.deleteMany({ where: { userId: id } });
      await tx.teamInvite.deleteMany({
        where: { OR: [{ invitedById: id }, { invitedUserId: id }] },
      });
      await tx.team.updateMany({
        where: { leaderId: id },
        data: { leaderId: user.id },
      });
      const prof = await tx.profile.findUnique({ where: { userId: id } });
      if (prof) {
        await tx.profileProject.deleteMany({ where: { profileId: prof.id } });
        await tx.profileSkill.deleteMany({ where: { profileId: prof.id } });
        await tx.experience.deleteMany({ where: { profileId: prof.id } });
        await tx.education.deleteMany({ where: { profileId: prof.id } });
        await tx.achievement.deleteMany({ where: { profileId: prof.id } });
        await tx.profile.delete({ where: { id: prof.id } });
      }
      await tx.user.delete({ where: { id } });
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.delete",
        entityType: "User",
        entityId: id,
        metadata: {
          deletedUserEmail: existing.email,
        },
      },
    });

    return { success: true, id };
  }

  static async updatePlatformRole(
    user: AuthUser,
    targetUserId: string,
    data: z.infer<typeof UpdatePlatformRoleSchema>
  ) {
    this.ensureSuperAdmin(user);

    await assertNotLastSuperAdmin(targetUserId, data.platformRole);

    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { platformRole: data.platformRole },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.platform_role_update",
        entityType: "User",
        entityId: targetUserId,
        metadata: {
          newPlatformRole: data.platformRole,
        },
      },
    });

    return updated;
  }

  static async assignRole(user: AuthUser, data: z.infer<typeof AdminAssignRoleSchema>) {
    this.ensureSuperAdmin(user);
    return StaffService.assignDirect(user, data.hackathonId, {
      userId: data.userId,
      role: data.role,
    });
  }

  static async revokeRole(user: AuthUser, data: z.infer<typeof AdminRevokeRoleSchema>) {
    this.ensureSuperAdmin(user);
    return StaffService.revokeRole(user, data.hackathonId, {
      userId: data.userId,
      role: data.role,
      staffId: data.staffId,
    });
  }

  static async suspendUser(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);

    if (user.id === id) throw AppError.badRequest("Cannot suspend yourself.");

    await assertNotLastSuperAdmin(id, undefined, "SUSPENDED");

    const updated = await db.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
    });

    // Revoke all active sessions
    await db.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.suspend",
        entityType: "User",
        entityId: id,
      },
    });

    return updated;
  }

  static async reactivateUser(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);

    const updated = await db.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.reactivate",
        entityType: "User",
        entityId: id,
      },
    });

    return updated;
  }

  static async getRolesAndPermissions(user: AuthUser) {
    if (user.platformRole !== "SUPER_ADMIN" && user.platformRole !== "SUPPORT_ADMIN") {
      throw AppError.forbidden("Admin access required.");
    }

    const [roles, permissions] = await Promise.all([
      db.role.findMany({
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
        orderBy: { code: "asc" },
      }),
      db.permission.findMany({
        orderBy: { category: "asc" },
      }),
    ]);

    return {
      roles,
      permissions,
      systemPermissions: SYSTEM_PERMISSIONS,
      defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS,
    };
  }

  static async getSupportQueue(user: AuthUser) {
    if (user.platformRole !== "SUPER_ADMIN" && user.platformRole !== "SUPPORT_ADMIN") {
      throw AppError.forbidden("Support Admin access required.");
    }

    const [recentUsers, suspendedUsers, unverifiedCount, recentAudits] = await Promise.all([
      db.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          platformRole: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
      }),
      db.user.findMany({
        where: { status: "SUSPENDED" },
        take: 20,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          platformRole: true,
          updatedAt: true,
        },
      }),
      db.user.count({
        where: { emailVerifiedAt: null },
      }),
      db.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      recentUsers,
      suspendedUsers,
      unverifiedCount,
      recentAudits,
    };
  }

  // --- Audit Logs ---

  static async getAuditLogs(user: AuthUser) {
    this.ensureSuperAdmin(user);

    return db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // --- Skills ---

  static async getSkills(user: AuthUser) {
    this.ensureSuperAdmin(user);
    return db.skill.findMany({ orderBy: { name: "asc" } });
  }

  static async createSkill(user: AuthUser, data: z.infer<typeof CreateSkillSchema>) {
    this.ensureSuperAdmin(user);
    const slug = slugify(data.name);

    const existing = await db.skill.findUnique({ where: { name: data.name } });
    if (existing) throw AppError.conflict("Skill already exists.");

    return db.skill.create({
      data: {
        name: data.name,
        slug,
      },
    });
  }

  static async updateSkill(user: AuthUser, id: string, data: z.infer<typeof UpdateSkillSchema>) {
    this.ensureSuperAdmin(user);
    const slug = slugify(data.name);

    return db.skill.update({
      where: { id },
      data: { name: data.name, slug },
    });
  }

  static async deleteSkill(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);
    await db.skill.delete({ where: { id } });
    return { success: true };
  }

  // --- Platform Dashboard Metrics ---

  static async getAdminHackathons(user: AuthUser) {
    if (user.platformRole !== "SUPER_ADMIN" && user.platformRole !== "SUPPORT_ADMIN") {
      throw AppError.forbidden("Admin access required.");
    }
    return db.hackathon.findMany({
      orderBy: { startsAt: "desc" },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { registrations: true, teams: true, submissions: true } },
      },
    });
  }

  static async createHackathon(user: AuthUser, data: z.infer<typeof AdminCreateHackathonSchema>) {
    this.ensureSuperAdmin(user);

    const org = await db.organization.findUnique({
      where: { id: data.organizationId },
    });
    if (!org) {
      throw AppError.notFound("Organization not found.");
    }

    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let counter = 1;
    while (await db.hackathon.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const hackathon = await db.hackathon.create({
      data: {
        title: data.title,
        slug,
        organizationId: data.organizationId,
        createdById: user.id,
        tagline: data.tagline,
        description: data.description,
        mode: data.mode as any,
        status: HackathonStatus.DRAFT,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : undefined,
        registrationOpensAt: data.registrationOpensAt ? new Date(data.registrationOpensAt) : undefined,
        registrationClosesAt: data.registrationClosesAt ? new Date(data.registrationClosesAt) : undefined,
        maxTeamSize: data.maxTeamSize,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        hackathonId: hackathon.id,
        action: "hackathon.create",
        entityType: "Hackathon",
        entityId: hackathon.id,
        metadata: { title: hackathon.title },
      },
    });

    return hackathon;
  }

  static async updateHackathon(user: AuthUser, id: string, data: z.infer<typeof AdminUpdateHackathonSchema>) {
    this.ensureSuperAdmin(user);

    const existing = await db.hackathon.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Hackathon not found.");

    const updated = await db.hackathon.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        tagline: data.tagline ?? undefined,
        description: data.description ?? undefined,
        mode: data.mode ? (data.mode as any) : undefined,
        status: data.status ? (data.status as any) : undefined,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : undefined,
        maxTeamSize: data.maxTeamSize ?? undefined,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { registrations: true, teams: true, submissions: true } },
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        hackathonId: id,
        action: "hackathon.update",
        entityType: "Hackathon",
        entityId: id,
        metadata: { changes: data },
      },
    });

    return updated;
  }

  static async deleteHackathon(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);

    const existing = await db.hackathon.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Hackathon not found.");

    await db.$transaction(async (tx) => {
      await tx.judgingCriterion.deleteMany({ where: { hackathonId: id } });
      await tx.track.deleteMany({ where: { hackathonId: id } });
      await tx.faq.deleteMany({ where: { hackathonId: id } });
      await tx.prize.deleteMany({ where: { hackathonId: id } });
      await tx.registrationQuestion.deleteMany({ where: { hackathonId: id } });
      await tx.sponsor.deleteMany({ where: { hackathonId: id } });
      await tx.scheduleItem.deleteMany({ where: { hackathonId: id } });
      await tx.announcement.deleteMany({ where: { hackathonId: id } });
      await tx.hackathonStaff.deleteMany({ where: { hackathonId: id } });
      await tx.registration.deleteMany({ where: { hackathonId: id } });

      const teams = await tx.team.findMany({ where: { hackathonId: id }, select: { id: true } });
      const teamIds = teams.map((t) => t.id);
      if (teamIds.length > 0) {
        await tx.prizeAward.deleteMany({ where: { submission: { teamId: { in: teamIds } } } });
        await tx.judgeAssignment.deleteMany({ where: { submission: { teamId: { in: teamIds } } } });
        await tx.submissionMedia.deleteMany({ where: { submission: { teamId: { in: teamIds } } } });
        await tx.submission.deleteMany({ where: { teamId: { in: teamIds } } });
        await tx.teamInvite.deleteMany({ where: { teamId: { in: teamIds } } });
        await tx.teamMember.deleteMany({ where: { teamId: { in: teamIds } } });
        await tx.team.deleteMany({ where: { id: { in: teamIds } } });
      }

      await tx.hackathon.delete({ where: { id } });
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "hackathon.delete",
        entityType: "Hackathon",
        entityId: id,
        metadata: { title: existing.title },
      },
    });

    return { success: true, id };
  }

  static async deleteTeam(user: AuthUser, teamId: string) {
    this.ensureSuperAdmin(user);

    const existing = await db.team.findUnique({ where: { id: teamId } });
    if (!existing) throw AppError.notFound("Team not found.");

    await db.$transaction(async (tx) => {
      await tx.prizeAward.deleteMany({ where: { submission: { teamId } } });
      await tx.judgeAssignment.deleteMany({ where: { submission: { teamId } } });
      await tx.submissionMedia.deleteMany({ where: { submission: { teamId } } });
      await tx.submission.deleteMany({ where: { teamId } });
      await tx.teamInvite.deleteMany({ where: { teamId } });
      await tx.teamMember.deleteMany({ where: { teamId } });
      await tx.team.delete({ where: { id: teamId } });
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "team.delete",
        entityType: "Team",
        entityId: teamId,
        metadata: { name: existing.name },
      },
    });

    return { success: true, id: teamId };
  }

  static async deleteSubmission(user: AuthUser, submissionId: string) {
    this.ensureSuperAdmin(user);

    const existing = await db.submission.findUnique({ where: { id: submissionId } });
    if (!existing) throw AppError.notFound("Submission not found.");

    await db.$transaction(async (tx) => {
      await tx.prizeAward.deleteMany({ where: { submissionId } });
      await tx.judgeAssignment.deleteMany({ where: { submissionId } });
      await tx.submissionMedia.deleteMany({ where: { submissionId } });
      await tx.submission.delete({ where: { id: submissionId } });
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "submission.delete",
        entityType: "Submission",
        entityId: submissionId,
        metadata: { title: existing.title },
      },
    });

    return { success: true, id: submissionId };
  }

  static async getAdminTeams(user: AuthUser) {
    this.ensureSuperAdmin(user);
    return db.team.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        hackathon: { select: { id: true, title: true, slug: true } },
        leader: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
        submission: { select: { id: true, title: true, status: true } },
      },
      take: 100,
    });
  }

  static async getAdminSubmissions(user: AuthUser) {
    this.ensureSuperAdmin(user);
    return db.submission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        hackathon: { select: { id: true, title: true, slug: true } },
        team: { select: { id: true, name: true } },
        track: { select: { id: true, name: true } },
      },
      take: 100,
    });
  }

  static async getDashboardStats(user: AuthUser) {
    this.ensureSuperAdmin(user);

    const now = new Date();

    // 1. Core platform metrics
    const [
      totalHackathons,
      totalOrganizations,
      totalRegistrations,
      totalTeams,
      totalSubmissions,
    ] = await Promise.all([
      db.hackathon.count(),
      db.organization.count(),
      db.registration.count(),
      db.team.count(),
      db.submission.count(),
    ]);

    // 2. Recent & active hackathons for table
    const recentHackathonsRaw = await db.hackathon.findMany({
      orderBy: { startsAt: "asc" },
      take: 6,
      include: {
        organization: { select: { name: true, slug: true } },
        _count: {
          select: {
            registrations: true,
            teams: true,
            submissions: true,
          },
        },
      },
    });

    const recentHackathons = recentHackathonsRaw.map((h) => {
      let status: "ONGOING" | "UPCOMING" | "COMPLETED" = "UPCOMING";
      if (h.startsAt <= now && h.endsAt >= now) {
        status = "ONGOING";
      } else if (h.endsAt < now) {
        status = "COMPLETED";
      }

      const startDateFormatted = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(h.startsAt);

      return {
        id: h.id,
        title: h.title,
        slug: h.slug,
        org: h.organization.name,
        status,
        registrations: h._count.registrations,
        teams: h._count.teams,
        submissions: h._count.submissions,
        startDate: startDateFormatted,
      };
    });

    // 3. Registrations by Hackathon (Donut breakdown)
    const donutColors = ["#F97316", "#3B82F6", "#10B981", "#94A3B8"];
    const topHackathonsForDonut = [...recentHackathonsRaw].sort(
      (a, b) => b._count.registrations - a._count.registrations
    );

    const topThree = topHackathonsForDonut.slice(0, 3);
    const otherCount = topHackathonsForDonut
      .slice(3)
      .reduce((acc, curr) => acc + curr._count.registrations, 0);

    const totalRegsSafe = Math.max(1, totalRegistrations);
    const registrationsByHackathon = [
      ...topThree.map((h, i) => ({
        name: h.title.replace(/\s+Hackathon$/i, ""),
        count: h._count.registrations,
        percent: Math.round((h._count.registrations / totalRegsSafe) * 100),
        color: donutColors[i % donutColors.length],
      })),
      {
        name: "Other",
        count: otherCount,
        percent: Math.max(
          0,
          100 -
            topThree.reduce(
              (acc, h) =>
                acc + Math.round((h._count.registrations / totalRegsSafe) * 100),
              0
            )
        ),
        color: donutColors[3],
      },
    ];

    // 4. Upcoming Deadlines
    const deadlineList: Array<{
      dateObj: Date;
      day: string;
      date: string;
      title: string;
      event: string;
      remaining: string;
      badgeColor: string;
    }> = [];

    const formatRemaining = (targetDate: Date) => {
      const diffMs = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return "Due today";
      if (diffDays === 1) return "1 day";
      return `${diffDays} days`;
    };

    for (const h of recentHackathonsRaw) {
      if (h.registrationClosesAt && h.registrationClosesAt > now) {
        deadlineList.push({
          dateObj: h.registrationClosesAt,
          day: h.registrationClosesAt.toLocaleString("en-US", { month: "short" }).toUpperCase(),
          date: String(h.registrationClosesAt.getDate()),
          title: "Registration Deadline",
          event: h.title,
          remaining: formatRemaining(h.registrationClosesAt),
          badgeColor: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
        });
      }
      if (h.submissionDeadline && h.submissionDeadline > now) {
        deadlineList.push({
          dateObj: h.submissionDeadline,
          day: h.submissionDeadline.toLocaleString("en-US", { month: "short" }).toUpperCase(),
          date: String(h.submissionDeadline.getDate()),
          title: "Submission Deadline",
          event: h.title,
          remaining: formatRemaining(h.submissionDeadline),
          badgeColor: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
        });
      }
      if (h.judgingStartsAt && h.judgingStartsAt > now) {
        deadlineList.push({
          dateObj: h.judgingStartsAt,
          day: h.judgingStartsAt.toLocaleString("en-US", { month: "short" }).toUpperCase(),
          date: String(h.judgingStartsAt.getDate()),
          title: "Judging Phase",
          event: h.title,
          remaining: formatRemaining(h.judgingStartsAt),
          badgeColor: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
        });
      }
      if (h.resultsPublishedAt && h.resultsPublishedAt > now) {
        deadlineList.push({
          dateObj: h.resultsPublishedAt,
          day: h.resultsPublishedAt.toLocaleString("en-US", { month: "short" }).toUpperCase(),
          date: String(h.resultsPublishedAt.getDate()),
          title: "Results Announcement",
          event: h.title,
          remaining: formatRemaining(h.resultsPublishedAt),
          badgeColor: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
        });
      }
    }

    deadlineList.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    const upcomingDeadlines = deadlineList.slice(0, 4);

    // 5. Recent Activity Feed from AuditLog
    const recentLogs = await db.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { name: true, email: true } },
      },
    });

    const formatTimeAgo = (date: Date) => {
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };

    const activities = recentLogs.map((log) => {
      const meta = (log.metadata as any) || {};
      let title = meta.title;
      let detail = meta.detail;
      let iconType = "file";

      if (!title) {
        switch (log.action) {
          case "team.register":
          case "team.create":
            title = "New team registered";
            detail = `${meta.name || "Team"} - ${meta.hackathon || "Hackathon"}`;
            iconType = "team";
            break;
          case "submission.create":
            title = "Submission received";
            detail = `${meta.title || "Project"} - ${meta.hackathon || "Hackathon"}`;
            iconType = "file";
            break;
          case "organization.create":
          case "organization.approve":
            title = "Organization onboarded";
            detail = `${meta.name || "Organization"} approved by Super Admin`;
            iconType = "org";
            break;
          case "hackathon.update":
            title = "Hackathon updated";
            detail = `${meta.title || "Hackathon"} details updated`;
            iconType = "edit";
            break;
          case "user.register":
            title = "New user registered";
            detail = log.actor?.email || "New developer";
            iconType = "user";
            break;
          default:
            title = log.action.replace(".", " ");
            detail = `${log.entityType} ${log.entityId || ""}`;
            iconType = "file";
        }
      }

      if (log.action.includes("team")) iconType = "team";
      else if (log.action.includes("submission")) iconType = "file";
      else if (log.action.includes("organization")) iconType = "org";
      else if (log.action.includes("user")) iconType = "user";
      else if (log.action.includes("hackathon")) iconType = "edit";

      return {
        id: log.id,
        title: title || log.action,
        detail: detail || `${log.entityType} updated`,
        time: formatTimeAgo(log.createdAt),
        iconType,
      };
    });

    // 6. Real Registrations Timeline Trend (From live Supabase registrations)
    const allRegistrations = await db.registration.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const checkpoints = [
      { label: "Oct 1", date: new Date("2026-10-01T23:59:59Z") },
      { label: "Oct 5", date: new Date("2026-10-05T23:59:59Z") },
      { label: "Oct 10", date: new Date("2026-10-10T23:59:59Z") },
      { label: "Oct 15", date: new Date("2026-10-15T23:59:59Z") },
      { label: "Oct 20", date: new Date("2026-10-20T23:59:59Z") },
      { label: "Oct 25", date: new Date("2026-10-25T23:59:59Z") },
      { label: "Oct 31", date: new Date("2026-10-31T23:59:59Z") },
    ];

    let prevCount = 0;
    const timeline = checkpoints.map((cp) => {
      const cumulative = allRegistrations.filter((r) => r.createdAt <= cp.date).length;
      const interval = Math.max(0, cumulative - prevCount);
      prevCount = cumulative;
      return {
        label: cp.label,
        cumulative,
        interval,
      };
    });

    return {
      stats: {
        totalHackathons,
        totalOrganizations,
        totalRegistrations,
        totalTeams,
        totalSubmissions,
      },
      hackathons: recentHackathons,
      registrationsByHackathon,
      deadlines: upcomingDeadlines,
      activities,
      timeline,
    };
  }
}
