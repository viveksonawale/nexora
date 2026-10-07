import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";
import {
  CreateRegistrationSchema,
  UpdateRegistrationStatusSchema,
  BulkUpdateRegistrationStatusSchema,
  CheckInSchema,
  QueryRegistrationSchema,
} from "./registration.schemas";
import { randomBytes } from "crypto";

export class RegistrationService {
  /**
   * Helper to ensure the user can manage registrations (OrgAdmin or Staff).
   */
  private static async getHackathonAndVerifyStaff(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      include: { organization: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (!can(user, "hackathon:read", { orgRole: membership?.role })) {
      throw AppError.forbidden("Permission denied.");
    }
    return { hackathon, membership };
  }

  static async register(user: AuthUser, hackathonId: string, data: z.infer<typeof CreateRegistrationSchema>) {
    const profile = await db.profile.findUnique({ where: { userId: user.id } });
    if (!profile?.onboardingCompleted) {
      throw AppError.businessRule("ONBOARDING_INCOMPLETE", "Complete your profile onboarding before registering.");
    }

    const hackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    const now = new Date();
    if (
      hackathon.registrationOpensAt &&
      hackathon.registrationClosesAt &&
      (now < hackathon.registrationOpensAt || now > hackathon.registrationClosesAt)
    ) {
      throw AppError.businessRule("REGISTRATION_CLOSED", "Registration is not open.");
    }

    const existing = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId, userId: user.id } },
    });
    if (existing) {
      throw AppError.conflict("You are already registered.");
    }

    // Capacity checking (transactional)
    return db.$transaction(async (tx) => {
      let status: RegistrationStatus = hackathon.requireApproval ? RegistrationStatus.PENDING : RegistrationStatus.APPROVED;

      if (hackathon.maxParticipants) {
        const approvedCount = await tx.registration.count({
          where: { hackathonId, status: "APPROVED" },
        });

        if (approvedCount >= hackathon.maxParticipants) {
          if (!hackathon.requireApproval) {
            status = RegistrationStatus.WAITLISTED;
          }
        }
      }

      const qrToken = randomBytes(16).toString("hex");

      const registration = await tx.registration.create({
        data: {
          hackathonId,
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
    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId, userId: user.id } },
      include: {
        teamMember: { include: { team: true } },
      },
    });
    if (!reg) throw AppError.notFound("Registration not found.");
    return reg;
  }

  static async withdraw(user: AuthUser, hackathonId: string) {
    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId, userId: user.id } },
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
    return { qrToken: reg.qrToken };
  }

  static async getRegistrations(user: AuthUser, hackathonId: string, query: z.infer<typeof QueryRegistrationSchema>) {
    await this.getHackathonAndVerifyStaff(user, hackathonId);

    const where: any = { hackathonId };
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
    const reg = await db.registration.findUnique({ where: { id } });
    if (!reg) throw AppError.notFound("Registration not found");

    const { membership } = await this.getHackathonAndVerifyStaff(user, reg.hackathonId);
    if (membership?.role !== "ADMIN" && membership?.role !== "OWNER") {
      throw AppError.forbidden("Only admins can manually update registration status.");
    }

    return db.registration.update({
      where: { id },
      data: { status: data.status },
    });
  }

  static async bulkUpdateStatus(user: AuthUser, hackathonId: string, data: z.infer<typeof BulkUpdateRegistrationStatusSchema>) {
    const { membership } = await this.getHackathonAndVerifyStaff(user, hackathonId);
    if (membership?.role !== "ADMIN" && membership?.role !== "OWNER") {
      throw AppError.forbidden("Only admins can manually update registration status.");
    }

    await db.registration.updateMany({
      where: { hackathonId, id: { in: data.ids } },
      data: { status: data.status },
    });
    return { success: true };
  }

  static async checkIn(user: AuthUser, hackathonId: string, data: z.infer<typeof CheckInSchema>) {
    await this.getHackathonAndVerifyStaff(user, hackathonId);

    const where = data.qrToken ? { qrToken: data.qrToken } : { id: data.registrationId! };
    const reg = await db.registration.findUnique({ where });

    if (!reg || reg.hackathonId !== hackathonId) throw AppError.notFound("Registration not found");
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
