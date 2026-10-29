import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { z } from "zod";
import {
  InviteStaffSchema,
  ProcessStaffInviteSchema,
  AssignStaffDirectSchema,
  RevokeStaffRoleSchema,
} from "./staff.schemas";
import { randomBytes } from "crypto";

export class StaffService {
  public static async getHackathonAndVerifyAdmin(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      include: { organization: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    if (user.platformRole === "SUPER_ADMIN") {
      return hackathon;
    }

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });

    const staffMember = await db.hackathonStaff.findFirst({
      where: {
        hackathonId,
        userId: user.id,
        role: "ORGANIZER",
        status: "ACTIVE",
      },
    });

    if (
      !can(user, "hackathon:manage_staff", {
        orgRole: membership?.role,
        staffRoles: staffMember ? ["ORGANIZER"] : [],
      })
    ) {
      throw AppError.forbidden("Permission denied. Organizer or Super Admin access required.");
    }

    return hackathon;
  }

  static async invite(user: AuthUser, hackathonId: string, data: z.infer<typeof InviteStaffSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);

    const token = randomBytes(16).toString("hex");

    const existingUser = await db.user.findUnique({ where: { email: data.email } });

    const invite = await db.hackathonStaff.upsert({
      where: {
        hackathonId_email_role: {
          hackathonId,
          email: data.email,
          role: data.role,
        },
      },
      update: {
        status: existingUser ? "ACTIVE" : "INVITED",
        userId: existingUser ? existingUser.id : undefined,
        tokenHash: existingUser ? null : token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        hackathonId,
        email: data.email,
        role: data.role,
        userId: existingUser ? existingUser.id : null,
        status: existingUser ? "ACTIVE" : "INVITED",
        tokenHash: existingUser ? null : token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        hackathonId,
        action: "staff.invite",
        entityType: "HackathonStaff",
        entityId: invite.id,
        metadata: {
          email: data.email,
          role: data.role,
          autoActivated: !!existingUser,
        },
      },
    });

    return {
      success: true,
      message: existingUser ? `Role ${data.role} assigned immediately to existing user.` : "Invite sent.",
      staffId: invite.id,
    };
  }

  static async assignDirect(
    actor: AuthUser,
    hackathonId: string,
    data: z.infer<typeof AssignStaffDirectSchema>
  ) {
    await this.getHackathonAndVerifyAdmin(actor, hackathonId);

    let targetUser = null;
    let email = data.email;

    if (data.userId) {
      targetUser = await db.user.findUnique({ where: { id: data.userId } });
      if (!targetUser) throw AppError.notFound("User not found.");
      email = targetUser.email;
    } else if (email) {
      targetUser = await db.user.findUnique({ where: { email } });
    }

    if (!email) throw AppError.badRequest("Email is required.");

    const staff = await db.hackathonStaff.upsert({
      where: {
        hackathonId_email_role: {
          hackathonId,
          email,
          role: data.role,
        },
      },
      update: {
        status: targetUser ? "ACTIVE" : "INVITED",
        userId: targetUser ? targetUser.id : undefined,
      },
      create: {
        hackathonId,
        email,
        role: data.role,
        status: targetUser ? "ACTIVE" : "INVITED",
        userId: targetUser ? targetUser.id : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await db.auditLog.create({
      data: {
        actorId: actor.id,
        hackathonId,
        action: "role.assign",
        entityType: "HackathonStaff",
        entityId: staff.id,
        metadata: {
          assignedUserId: targetUser?.id,
          targetEmail: email,
          role: data.role,
          status: staff.status,
        },
      },
    });

    return staff;
  }

  static async revokeRole(
    actor: AuthUser,
    hackathonId: string,
    data: z.infer<typeof RevokeStaffRoleSchema>
  ) {
    await this.getHackathonAndVerifyAdmin(actor, hackathonId);

    const where: any = { hackathonId };
    if (data.staffId) {
      where.id = data.staffId;
    } else if (data.userId && data.role) {
      where.userId = data.userId;
      where.role = data.role;
    } else if (data.userId) {
      where.userId = data.userId;
    } else {
      throw AppError.badRequest("Either staffId or userId is required.");
    }

    const existing = await db.hackathonStaff.findFirst({ where });
    if (!existing) throw AppError.notFound("Staff assignment not found.");

    await db.hackathonStaff.delete({ where: { id: existing.id } });

    await db.auditLog.create({
      data: {
        actorId: actor.id,
        hackathonId,
        action: "role.revoke",
        entityType: "HackathonStaff",
        entityId: existing.id,
        metadata: {
          targetUserId: existing.userId,
          targetEmail: existing.email,
          role: existing.role,
        },
      },
    });

    return { success: true };
  }

  static async accept(user: AuthUser, data: z.infer<typeof ProcessStaffInviteSchema>) {
    const invite = await db.hackathonStaff.findUnique({ where: { tokenHash: data.token } });
    if (!invite || invite.status !== "INVITED") {
      throw AppError.notFound("Invite not found or already processed.");
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw AppError.businessRule("INVALID_STATE", "Invite expired.");
    }
    if (invite.email !== user.email) {
      throw AppError.forbidden("Invite email does not match your account.");
    }

    const updated = await db.hackathonStaff.update({
      where: { id: invite.id },
      data: { status: "ACTIVE", userId: user.id, tokenHash: null },
    });

    await db.auditLog.create({
      data: {
        actorId: user.id,
        hackathonId: invite.hackathonId,
        action: "role.accept",
        entityType: "HackathonStaff",
        entityId: invite.id,
        metadata: { role: invite.role },
      },
    });

    return updated;
  }

  static async decline(user: AuthUser, data: z.infer<typeof ProcessStaffInviteSchema>) {
    const invite = await db.hackathonStaff.findUnique({ where: { tokenHash: data.token } });
    if (!invite || invite.status !== "INVITED") throw AppError.notFound("Invite not found or already processed.");
    if (invite.email !== user.email) throw AppError.forbidden("Invite email does not match your account.");

    return db.hackathonStaff.update({ where: { id: invite.id }, data: { status: "DECLINED" } });
  }

  static async getStaffList(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    if (user.platformRole !== "SUPER_ADMIN") {
      const membership = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
      });
      const staffMember = await db.hackathonStaff.findFirst({
        where: { hackathonId, userId: user.id, status: "ACTIVE" },
      });

      if (
        !can(user, "hackathon:read", {
          orgRole: membership?.role,
          staffRoles: staffMember ? [staffMember.role] : [],
        })
      ) {
        throw AppError.forbidden("Permission denied.");
      }
    }

    return db.hackathonStaff.findMany({
      where: { hackathonId },
      include: {
        user: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async removeStaff(user: AuthUser, hackathonId: string, staffId: string) {
    return this.revokeRole(user, hackathonId, { staffId });
  }
}
