import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { z } from "zod";
import { InviteStaffSchema, ProcessStaffInviteSchema } from "./staff.schemas";
import { randomBytes } from "crypto";

export class StaffService {
  private static async getHackathonAndVerifyAdmin(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      include: { organization: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (!can(user, "hackathon:update", { orgRole: membership?.role })) {
      throw AppError.forbidden("Permission denied.");
    }
    return hackathon;
  }

  static async invite(user: AuthUser, hackathonId: string, data: z.infer<typeof InviteStaffSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);

    const token = randomBytes(16).toString("hex");

    const invite = await db.hackathonStaff.create({
      data: {
        hackathonId,
        email: data.email,
        role: data.role,
        tokenHash: token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // TODO: Send email
    // await queueEmail({ to: data.email, template: "STAFF_INVITE", ... });

    return { success: true, message: "Invite sent." };
  }

  static async accept(user: AuthUser, data: z.infer<typeof ProcessStaffInviteSchema>) {
    const invite = await db.hackathonStaff.findUnique({ where: { tokenHash: data.token } });
    if (!invite || invite.status !== "INVITED") {
      throw AppError.notFound("Invite not found or already processed.");
    }
    if (invite.expiresAt! < new Date()) {
      throw AppError.businessRule("INVALID_STATE", "Invite expired.");
    }
    if (invite.email !== user.email) {
      throw AppError.forbidden("Invite email does not match your account.");
    }

    return db.$transaction(async (tx) => {
      await tx.hackathonStaff.update({ where: { id: invite.id }, data: { status: "ACTIVE", userId: user.id } });
      
      // The invite is the hackathonStaff record itself
      return tx.hackathonStaff.update({
        where: { id: invite.id },
        data: { status: "ACTIVE", userId: user.id, tokenHash: null },
      });
    });
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

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (!can(user, "hackathon:read", { orgRole: membership?.role })) {
      throw AppError.forbidden("Permission denied.");
    }

    return db.hackathonStaff.findMany({
      where: { hackathonId },
      include: {
        user: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
      },
    });
  }

  static async removeStaff(user: AuthUser, hackathonId: string, staffId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    
    // Soft delete or status change or hard delete
    await db.hackathonStaff.delete({ where: { id: staffId } });
    return { success: true };
  }
}
