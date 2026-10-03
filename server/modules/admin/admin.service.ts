import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser } from "@/server/policies/policy";
import { OrganizationStatus, UserStatus } from "@prisma/client";
import { z } from "zod";
import { QueryOrganizationsSchema, QueryUsersSchema, CreateSkillSchema, UpdateSkillSchema } from "./admin.schemas";
import { slugify } from "@/server/utils/slugify";
import { queueEmail } from "@/server/modules/email/email.service";

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

  // --- Users ---

  static async getUsers(user: AuthUser, query: z.infer<typeof QueryUsersSchema>) {
    this.ensureSuperAdmin(user);

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
      take: 50,
    });
  }

  static async suspendUser(user: AuthUser, id: string) {
    this.ensureSuperAdmin(user);

    if (user.id === id) throw AppError.badRequest("Cannot suspend yourself.");

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
}
