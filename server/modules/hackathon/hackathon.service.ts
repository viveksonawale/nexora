import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { HackathonStatus, OrganizationStatus } from "@prisma/client";
import { z } from "zod";
import {
  CreateHackathonSchema,
  UpdateHackathonSchema,
  QueryHackathonSchema,
  TrackSchema,
  PrizeSchema,
  SponsorSchema,
  ScheduleItemSchema,
  FaqSchema,
  RegistrationQuestionSchema,
  JudgingCriterionSchema,
} from "./hackathon.schemas";
import { slugify } from "@/server/utils/slugify";

export class HackathonService {
  /**
   * Helper to ensure the user can manage the hackathon (either OrgOwner or OrgAdmin).
   */
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
      throw AppError.forbidden("You do not have permission to manage this hackathon.");
    }

    return hackathon;
  }

  // ============================================================
  // CORE HACKATHON
  // ============================================================

  static async createHackathon(user: AuthUser, orgId: string, data: z.infer<typeof CreateHackathonSchema>) {
    const org = await db.organization.findUnique({
      where: { id: orgId },
      include: {
        members: { where: { userId: user.id } },
      },
    });

    if (!org) throw AppError.notFound("Organization not found.");
    if (org.status !== OrganizationStatus.ACTIVE) {
      throw AppError.businessRule("INVALID_STATE", "Organization must be ACTIVE to create hackathons.");
    }

    const membership = org.members[0];
    if (!can(user, "hackathon:create", { orgRole: membership?.role })) {
      throw AppError.forbidden("You do not have permission to create hackathons here.");
    }

    let slug = slugify(data.title);
    let counter = 1;
    while (await db.hackathon.findUnique({ where: { slug } })) {
      slug = `${slugify(data.title)}-${counter++}`;
    }

    const hackathon = await db.hackathon.create({
      data: {
        title: data.title,
        slug,
        organizationId: orgId,
        createdById: user.id,
        mode: data.mode,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        status: HackathonStatus.DRAFT,
      },
    });

    return hackathon;
  }

  static async getHackathons(query: z.infer<typeof QueryHackathonSchema>) {
    const where: any = {
      status: HackathonStatus.PUBLISHED,
      visibility: "PUBLIC",
    };

    if (query.q) {
      where.title = { contains: query.q, mode: "insensitive" };
    }
    if (query.mode) where.mode = query.mode;
    if (query.city) where.city = { contains: query.city, mode: "insensitive" };
    if (query.tag) where.tags = { has: query.tag };
    if (query.orgSlug) where.organization = { slug: query.orgSlug };
    
    // Add date filtering
    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) where.startsAt.gte = query.from;
      if (query.to) where.startsAt.lte = query.to;
    }

    let orderBy: any = { startsAt: "asc" };
    if (query.sort === "deadline") orderBy = { submissionDeadline: "asc" };
    if (query.sort === "newest") orderBy = { createdAt: "desc" };

    const hackathons = await db.hackathon.findMany({
      where,
      orderBy,
      include: {
        organization: { select: { name: true, slug: true, logoUrl: true } },
      },
      take: 50,
    });

    // Compute phases for each
    return hackathons.map(h => {
      const now = new Date();
      let phase = "Upcoming";
      
      if (h.registrationOpensAt && h.registrationClosesAt) {
        if (now < h.registrationOpensAt) phase = "Registrations Upcoming";
        else if (now >= h.registrationOpensAt && now <= h.registrationClosesAt) phase = "Registrations Open";
        else phase = "Registrations Closed";
      }
      
      if (now >= h.startsAt && now <= h.endsAt) phase = "Hacking";
      if (h.submissionDeadline && now > h.submissionDeadline) phase = "Submissions Closed";
      if (h.judgingStartsAt && h.judgingEndsAt && now >= h.judgingStartsAt && now <= h.judgingEndsAt) phase = "Judging";
      if (h.resultsPublishedAt && now >= h.resultsPublishedAt) phase = "Ended";

      // Manual override for phase filter if needed
      return { ...h, computedPhase: phase };
    }).filter(h => !query.phase || h.computedPhase.toLowerCase().includes(query.phase.toLowerCase()));
  }

  static async getHackathonPublic(idOrSlug: string, user: AuthUser | null) {
    const isCuid = idOrSlug.length >= 24; // Simple check

    const hackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        organization: true,
        tracks: { orderBy: { sortOrder: "asc" } },
        prizes: { include: { sponsor: true, track: true }, orderBy: { sortOrder: "asc" } },
        sponsors: { orderBy: { sortOrder: "asc" } },
        scheduleItems: { orderBy: { startsAt: "asc" } },
        faqs: { orderBy: { sortOrder: "asc" } },
        staff: {
          where: { role: { in: ["JUDGE", "MENTOR"] }, status: "ACTIVE" },
          include: { user: { select: { name: true, profile: { select: { avatarUrl: true, headline: true } } } } },
        },
      },
    });

    if (!hackathon) throw AppError.notFound("Hackathon not found");

    if (hackathon.status !== "PUBLISHED") {
      // Must be staff/admin of org to view DRAFT
      if (!user) throw AppError.notFound("Hackathon not found");
      const membership = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
      });
      if (!can(user, "hackathon:read", { orgRole: membership?.role })) {
        throw AppError.notFound("Hackathon not found");
      }
    }

    let myRegistration = null;
    if (user) {
      myRegistration = await db.registration.findUnique({
        where: { hackathonId_userId: { hackathonId: hackathon.id, userId: user.id } },
        include: { teamMember: { include: { team: true } } },
      });
    }

    const seatsLeft = hackathon.maxParticipants
      ? hackathon.maxParticipants - (await db.registration.count({ where: { hackathonId: hackathon.id, status: "APPROVED" } }))
      : null;

    return { ...hackathon, myRegistration, seatsLeft };
  }

  static async updateHackathon(user: AuthUser, id: string, data: z.infer<typeof UpdateHackathonSchema>) {
    await this.getHackathonAndVerifyAdmin(user, id);

    const hackathon = await db.hackathon.update({
      where: { id },
      data,
    });

    return hackathon;
  }

  static async publishHackathon(user: AuthUser, id: string) {
    const hackathon = await this.getHackathonAndVerifyAdmin(user, id);
    
    if (hackathon.status === "PUBLISHED") throw AppError.businessRule("INVALID_STATE", "Already published");
    
    // Completeness validations
    if (!hackathon.tagline || !hackathon.description || !hackathon.bannerUrl) {
      throw AppError.businessRule("INVALID_STATE", "Please complete all core details (tagline, description, banner) before publishing.");
    }
    if (!hackathon.registrationOpensAt || !hackathon.registrationClosesAt || !hackathon.submissionDeadline) {
      throw AppError.businessRule("INVALID_STATE", "Please set registration and submission deadlines before publishing.");
    }

    return db.hackathon.update({
      where: { id },
      data: { status: HackathonStatus.PUBLISHED },
    });
  }

  static async unpublishHackathon(user: AuthUser, id: string) {
    const hackathon = await this.getHackathonAndVerifyAdmin(user, id);
    if (hackathon.status !== "PUBLISHED") throw AppError.businessRule("INVALID_STATE", "Not published");
    
    const approvedCount = await db.registration.count({ where: { hackathonId: id, status: "APPROVED" } });
    if (approvedCount > 0) throw AppError.businessRule("INVALID_STATE", "Cannot unpublish a hackathon with approved registrations.");

    return db.hackathon.update({
      where: { id },
      data: { status: HackathonStatus.DRAFT },
    });
  }

  static async cancelHackathon(user: AuthUser, id: string) {
    await this.getHackathonAndVerifyAdmin(user, id);
    return db.hackathon.update({
      where: { id },
      data: { status: HackathonStatus.CANCELLED },
    });
  }

  static async archiveHackathon(user: AuthUser, id: string) {
    await this.getHackathonAndVerifyAdmin(user, id);
    return db.hackathon.update({
      where: { id },
      data: { status: HackathonStatus.ARCHIVED },
    });
  }

  static async cloneHackathon(user: AuthUser, id: string) {
    const original = await this.getHackathonAndVerifyAdmin(user, id);
    
    // Just copy the basic config for now as per spec
    let slug = `${original.slug}-clone`;
    let counter = 1;
    while (await db.hackathon.findUnique({ where: { slug } })) {
      slug = `${original.slug}-clone-${counter++}`;
    }

    const cloned = await db.hackathon.create({
      data: {
        title: `${original.title} (Clone)`,
        slug,
        organizationId: original.organizationId,
        createdById: user.id,
        mode: original.mode,
        startsAt: new Date(), // placeholder
        endsAt: new Date(Date.now() + 86400000),
        status: HackathonStatus.DRAFT,
      },
    });

    return cloned;
  }

  static async getOrganizationHackathons(user: AuthUser, orgId: string) {
    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });

    if (!can(user, "hackathon:read", { orgRole: membership?.role })) {
      throw AppError.forbidden("You do not have permission to view this organization's hackathons.");
    }

    return db.hackathon.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getHackathonAuditLog(user: AuthUser, hackathonId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.auditLog.findMany({
      where: { hackathonId },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true, email: true } } },
    });
  }

  static async getHackathonDashboard(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });

    if (!can(user, "hackathon:read", { orgRole: membership?.role })) {
      throw AppError.forbidden("You do not have permission to view the dashboard.");
    }

    const totalRegistrations = await db.registration.count({ where: { hackathonId } });
    const approvedRegistrations = await db.registration.count({ where: { hackathonId, status: "APPROVED" } });
    const checkedIn = await db.registration.count({ where: { hackathonId, checkedInAt: { not: null } } });
    const teamsCount = await db.team.count({ where: { hackathonId } });
    const submissionsCount = await db.submission.count({ where: { hackathonId, status: "SUBMITTED" } });

    return {
      stats: {
        totalRegistrations,
        approvedRegistrations,
        checkedIn,
        teamsCount,
        submissionsCount,
      }
    };
  }

  // ============================================================
  // SUB-RESOURCES (Tracks, Prizes, etc.)
  // ============================================================

  static async createTrack(user: AuthUser, hackathonId: string, data: z.infer<typeof TrackSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.track.create({ data: { ...data, hackathonId } });
  }

  static async updateTrack(user: AuthUser, hackathonId: string, trackId: string, data: z.infer<typeof TrackSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.track.update({ where: { id: trackId }, data });
  }

  static async deleteTrack(user: AuthUser, hackathonId: string, trackId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    await db.track.delete({ where: { id: trackId } });
  }

  // Similar implementations for Prizes, Sponsors, Schedule, FAQs, Questions, Criteria
  static async createPrize(user: AuthUser, hackathonId: string, data: z.infer<typeof PrizeSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.prize.create({ data: { ...data, hackathonId } });
  }

  static async updatePrize(user: AuthUser, hackathonId: string, prizeId: string, data: z.infer<typeof PrizeSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.prize.update({ where: { id: prizeId }, data });
  }

  static async deletePrize(user: AuthUser, hackathonId: string, prizeId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    await db.prize.delete({ where: { id: prizeId } });
  }

  static async createSponsor(user: AuthUser, hackathonId: string, data: z.infer<typeof SponsorSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.sponsor.create({ data: { ...data, hackathonId } });
  }

  static async updateSponsor(user: AuthUser, hackathonId: string, sponsorId: string, data: z.infer<typeof SponsorSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.sponsor.update({ where: { id: sponsorId }, data });
  }

  static async deleteSponsor(user: AuthUser, hackathonId: string, sponsorId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    await db.sponsor.delete({ where: { id: sponsorId } });
  }

  static async createSchedule(user: AuthUser, hackathonId: string, data: z.infer<typeof ScheduleItemSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.scheduleItem.create({ data: { ...data, hackathonId } });
  }

  static async updateSchedule(user: AuthUser, hackathonId: string, scheduleId: string, data: z.infer<typeof ScheduleItemSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.scheduleItem.update({ where: { id: scheduleId }, data });
  }

  static async deleteSchedule(user: AuthUser, hackathonId: string, scheduleId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    await db.scheduleItem.delete({ where: { id: scheduleId } });
  }

  static async createFaq(user: AuthUser, hackathonId: string, data: z.infer<typeof FaqSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.faq.create({ data: { ...data, hackathonId } });
  }

  static async updateFaq(user: AuthUser, hackathonId: string, faqId: string, data: z.infer<typeof FaqSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.faq.update({ where: { id: faqId }, data });
  }

  static async deleteFaq(user: AuthUser, hackathonId: string, faqId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    await db.faq.delete({ where: { id: faqId } });
  }

  static async createQuestion(user: AuthUser, hackathonId: string, data: z.infer<typeof RegistrationQuestionSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    const regCount = await db.registration.count({ where: { hackathonId } });
    if (regCount > 0) throw AppError.businessRule("INVALID_STATE", "Cannot add questions once registrations exist.");
    return db.registrationQuestion.create({ data: { ...data, hackathonId } });
  }

  static async updateQuestion(user: AuthUser, hackathonId: string, questionId: string, data: z.infer<typeof RegistrationQuestionSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    // Allow updating text/sortOrder even with registrations, but not 'type'
    const existing = await db.registrationQuestion.findUnique({ where: { id: questionId } });
    if (existing?.type !== data.type) {
      const regCount = await db.registration.count({ where: { hackathonId } });
      if (regCount > 0) throw AppError.businessRule("INVALID_STATE", "Cannot change question type once registrations exist.");
    }
    return db.registrationQuestion.update({ where: { id: questionId }, data });
  }

  static async deleteQuestion(user: AuthUser, hackathonId: string, questionId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    const regCount = await db.registration.count({ where: { hackathonId } });
    if (regCount > 0) throw AppError.businessRule("INVALID_STATE", "Cannot delete questions once registrations exist.");
    await db.registrationQuestion.delete({ where: { id: questionId } });
  }

  static async createCriterion(user: AuthUser, hackathonId: string, data: z.infer<typeof JudgingCriterionSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    const scoreCount = await db.score.count({ where: { criterion: { hackathonId } } });
    if (scoreCount > 0) throw AppError.businessRule("INVALID_STATE", "Cannot add criteria once scores exist.");
    return db.judgingCriterion.create({ data: { ...data, hackathonId } });
  }

  static async updateCriterion(user: AuthUser, hackathonId: string, criterionId: string, data: z.infer<typeof JudgingCriterionSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    const scoreCount = await db.score.count({ where: { criterionId } });
    if (scoreCount > 0) throw AppError.businessRule("INVALID_STATE", "Cannot modify criteria once scores exist.");
    return db.judgingCriterion.update({ where: { id: criterionId }, data });
  }

  static async deleteCriterion(user: AuthUser, hackathonId: string, criterionId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    const scoreCount = await db.score.count({ where: { criterionId } });
    if (scoreCount > 0) throw AppError.businessRule("INVALID_STATE", "Cannot delete criteria once scores exist.");
    await db.judgingCriterion.delete({ where: { id: criterionId } });
  }
}
