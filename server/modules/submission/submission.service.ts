import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { z } from "zod";
import {
  UpsertSubmissionSchema,
  SubmitSubmissionSchema,
  AddMediaSchema,
  DisqualifySchema,
} from "./submission.schemas";
import { randomBytes } from "crypto";
import { SubmissionStatus } from "@prisma/client";

export class SubmissionService {
  private static async ensureNotLocked(hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw AppError.notFound("Hackathon not found");
    if (hackathon.submissionDeadline && new Date() > hackathon.submissionDeadline) {
      throw AppError.businessRule("SUBMISSION_LOCKED", "Submissions are locked after the deadline.");
    }
    return hackathon;
  }

  private static generateAnonymousCode() {
    return "P-" + randomBytes(3).toString("hex").toUpperCase();
  }

  static async getSubmissionByTeamId(user: AuthUser, teamId: string) {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { registration: true } }, submission: { include: { media: true } } },
    });
    if (!team) throw AppError.notFound("Team not found");

    const isMember = team.members.some(m => m.registration.userId === user.id);
    
    // Check if staff
    let isStaff = false;
    if (!isMember) {
      const membership = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: team.hackathonId, userId: user.id } }, // Wait, hackathon -> org. Let's do a join.
      });
      // Simplified: if can("hackathon:read"), they can view submissions
      // Actually OrgStaff has read. 
      const hackathon = await db.hackathon.findUnique({ where: { id: team.hackathonId } });
      if (hackathon) {
        const orgMembership = await db.organizationMember.findUnique({
          where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
        });
        if (can(user, "hackathon:read", { orgRole: orgMembership?.role })) {
          isStaff = true;
        }
      }
    }

    if (!isMember && !isStaff) {
      throw AppError.forbidden("You do not have permission to view this submission.");
    }

    return team.submission || null;
  }

  static async upsertDraft(user: AuthUser, teamId: string, data: z.infer<typeof UpsertSubmissionSchema>) {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { registration: true } }, submission: true },
    });
    if (!team) throw AppError.notFound("Team not found");

    const isMember = team.members.some(m => m.registration.userId === user.id);
    if (!isMember) throw AppError.forbidden("Only team members can edit submissions.");

    await this.ensureNotLocked(team.hackathonId);

    if (team.submission) {
      return db.submission.update({
        where: { id: team.submission.id },
        data,
      });
    }

    const anonymousCode = this.generateAnonymousCode();
    return db.submission.create({
      data: {
        ...data,
        teamId,
        hackathonId: team.hackathonId,
        anonymousCode,
        status: SubmissionStatus.DRAFT,
      },
    });
  }

  static async addMedia(user: AuthUser, teamId: string, data: z.infer<typeof AddMediaSchema>) {
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { members: { include: { registration: true } }, submission: true },
    });
    if (!team) throw AppError.notFound("Team not found");

    const isMember = team.members.some(m => m.registration.userId === user.id);
    if (!isMember) throw AppError.forbidden("Only team members can edit submissions.");

    if (!team.submission) throw AppError.businessRule("INVALID_STATE", "Please save a draft submission first.");

    await this.ensureNotLocked(team.hackathonId);

    return db.submissionMedia.create({
      data: {
        submissionId: team.submission.id,
        kind: data.kind,
        url: data.url || "",
        fileAssetId: data.fileAssetId,
        caption: data.caption,
      },
    });
  }

  static async removeMedia(user: AuthUser, submissionId: string, mediaId: string) {
    const sub = await db.submission.findUnique({
      where: { id: submissionId },
      include: { team: { include: { members: { include: { registration: true } } } } },
    });
    if (!sub) throw AppError.notFound("Submission not found");

    const isMember = sub.team.members.some(m => m.registration.userId === user.id);
    if (!isMember) throw AppError.forbidden("Only team members can edit submissions.");

    await this.ensureNotLocked(sub.hackathonId);

    await db.submissionMedia.delete({ where: { id: mediaId } });
    return { success: true };
  }

  static async submit(user: AuthUser, submissionId: string) {
    const sub = await db.submission.findUnique({
      where: { id: submissionId },
      include: { team: { include: { members: { include: { registration: true } } } } },
    });
    if (!sub) throw AppError.notFound("Submission not found");

    const isMember = sub.team.members.some(m => m.registration.userId === user.id);
    if (!isMember) throw AppError.forbidden("Only team members can submit.");

    await this.ensureNotLocked(sub.hackathonId);

    // Validate required fields
    SubmitSubmissionSchema.parse({ title: sub.title, description: sub.description || "" });

    return db.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.SUBMITTED, submittedAt: new Date() },
    });
  }

  static async unsubmit(user: AuthUser, submissionId: string) {
    const sub = await db.submission.findUnique({
      where: { id: submissionId },
      include: { team: { include: { members: { include: { registration: true } } } } },
    });
    if (!sub) throw AppError.notFound("Submission not found");

    const isMember = sub.team.members.some(m => m.registration.userId === user.id);
    if (!isMember) throw AppError.forbidden("Only team members can edit submissions.");

    await this.ensureNotLocked(sub.hackathonId);

    return db.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.DRAFT, submittedAt: null },
    });
  }

  private static async getHackathonAndVerifyStaff(user: AuthUser, hackathonIdOrSlug: string) {
    const isCuid = hackathonIdOrSlug.length >= 24;
    const hackathon = await db.hackathon.findFirst({
      where: isCuid ? { id: hackathonIdOrSlug } : { slug: hackathonIdOrSlug },
      include: { organization: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (!can(user, "hackathon:update", { orgRole: membership?.role })) {
      throw AppError.forbidden("Permission denied.");
    }
    return { hackathon, membership };
  }

  static async disqualify(user: AuthUser, submissionId: string, data: z.infer<typeof DisqualifySchema>) {
    const sub = await db.submission.findUnique({ where: { id: submissionId } });
    if (!sub) throw AppError.notFound("Submission not found");

    await this.getHackathonAndVerifyStaff(user, sub.hackathonId);

    return db.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.DISQUALIFIED }, // Need a note column/table realistically, but changing status for now
    });
  }

  static async reinstate(user: AuthUser, submissionId: string) {
    const sub = await db.submission.findUnique({ where: { id: submissionId } });
    if (!sub) throw AppError.notFound("Submission not found");

    await this.getHackathonAndVerifyStaff(user, sub.hackathonId);

    return db.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.SUBMITTED },
    });
  }

  static async getPublicProjects(hackathonIdOrSlug: string) {
    const hackathon = await db.hackathon.findFirst({
      where: {
        OR: [{ id: hackathonIdOrSlug }, { slug: hackathonIdOrSlug }],
      },
    });

    if (!hackathon) throw AppError.notFound("Hackathon not found");

    // Only allow if results are published or judging is done/locked, per rules?
    // "only after results are published"
    if (!hackathon.resultsPublishedAt || new Date() < hackathon.resultsPublishedAt) {
      throw AppError.businessRule("INVALID_STATE", "Projects are not public yet.");
    }

    const submissions = await db.submission.findMany({
      where: {
        hackathonId: hackathon.id,
        status: SubmissionStatus.SUBMITTED,
      },
      include: {
        team: {
          select: {
            name: true,
            leader: { select: { name: true } },
          }
        },
        media: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return submissions.map(sub => ({
      id: sub.id,
      title: sub.title,
      tagline: sub.tagline,
      description: sub.description,
      teamName: sub.team.name,
      leaderName: sub.team.leader.name,
      media: sub.media.map(m => ({ kind: m.kind, url: m.url, caption: m.caption })),
    }));
  }

  static async getHackathonSubmissions(user: AuthUser, hackathonIdOrSlug: string) {
    const { hackathon } = await this.getHackathonAndVerifyStaff(user, hackathonIdOrSlug);
    
    return db.submission.findMany({
      where: { hackathonId: hackathon.id, status: { not: SubmissionStatus.DRAFT } },
      include: {
        team: {
          include: {
            leader: { select: { name: true, email: true } },
            members: { include: { registration: { include: { user: { select: { name: true, email: true } } } } } }
          }
        },
        media: true,
        assignments: true,
      },
      orderBy: { submittedAt: "desc" }
    });
  }

  static async getPublicProject(id: string) {
    const sub = await db.submission.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            leader: { select: { name: true, profile: { select: { avatarUrl: true, headline: true, slug: true } } } },
            members: {
              include: {
                registration: {
                  include: {
                    user: { select: { name: true, profile: { select: { avatarUrl: true, headline: true, slug: true } } } }
                  }
                }
              }
            }
          }
        },
        media: true,
        hackathon: true,
      },
    });

    if (!sub || sub.status !== SubmissionStatus.SUBMITTED) throw AppError.notFound("Project not found");

    if (!sub.hackathon.resultsPublishedAt || new Date() < sub.hackathon.resultsPublishedAt) {
      throw AppError.businessRule("INVALID_STATE", "Project is not public yet.");
    }

    return {
      id: sub.id,
      title: sub.title,
      tagline: sub.tagline,
      description: sub.description,
      repoUrl: sub.repoUrl,
      demoUrl: sub.demoUrl,
      videoUrl: sub.videoUrl,
      presentationUrl: sub.presentationUrl,
      techStack: sub.techStack,
      team: {
        name: sub.team.name,
        leader: sub.team.leader,
        members: sub.team.members.map(m => m.registration.user),
      },
      media: sub.media.map(m => ({ kind: m.kind, url: m.url, caption: m.caption })),
    };
  }
}
