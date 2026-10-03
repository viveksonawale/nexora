import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { z } from "zod";
import {
  AutoAssignJudgesSchema,
  ManualAssignJudgeSchema,
  SubmitScoresSchema,
  AwardPrizeSchema,
  LockJudgingSchema,
} from "./judging.schemas";

export class JudgingService {
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

  static async autoAssign(user: AuthUser, hackathonId: string, data: z.infer<typeof AutoAssignJudgesSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);

    const submissions = await db.submission.findMany({ where: { hackathonId, status: "SUBMITTED" } });
    const judges = await db.hackathonStaff.findMany({ where: { hackathonId, role: "JUDGE", status: "ACTIVE" } });

    if (judges.length === 0) throw AppError.businessRule("INVALID_STATE", "No active judges available.");
    if (submissions.length === 0) throw AppError.businessRule("INVALID_STATE", "No submitted projects.");

    // Simple round-robin assignment for demonstration (ignoring conflicts for brevity)
    const assignments = [];
    let judgeIndex = 0;

    for (const sub of submissions) {
      for (let i = 0; i < data.judgesPerSubmission; i++) {
        const judge = judges[judgeIndex % judges.length];
        assignments.push({
          staffId: judge.id,
          submissionId: sub.id,
        });
        judgeIndex++;
      }
    }

    // Upsert or filter out existing (simplified to ignore conflicts in this iteration)
    // Realistically you'd want a transaction and ignore duplicates
    await db.judgeAssignment.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    return { success: true, assignmentsCreated: assignments.length };
  }

  static async manualAssign(user: AuthUser, hackathonId: string, data: z.infer<typeof ManualAssignJudgeSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);

    const exists = await db.judgeAssignment.findUnique({
      where: { staffId_submissionId: { staffId: data.staffId, submissionId: data.submissionId } },
    });
    if (exists) throw AppError.conflict("Assignment already exists.");

    return db.judgeAssignment.create({
      data: {
        staffId: data.staffId,
        submissionId: data.submissionId,
      },
    });
  }

  static async deleteAssignment(user: AuthUser, assignmentId: string) {
    const assignment = await db.judgeAssignment.findUnique({ where: { id: assignmentId }, include: { submission: true } });
    if (!assignment) throw AppError.notFound("Assignment not found");

    await this.getHackathonAndVerifyAdmin(user, assignment.submission.hackathonId);

    if (assignment.finalizedAt !== null) throw AppError.businessRule("INVALID_STATE", "Cannot delete finalized assignment.");

    await db.judgeAssignment.delete({ where: { id: assignmentId } });
    return { success: true };
  }

  static async reopenAssignment(user: AuthUser, assignmentId: string) {
    const assignment = await db.judgeAssignment.findUnique({ where: { id: assignmentId }, include: { submission: true } });
    if (!assignment) throw AppError.notFound("Assignment not found");

    const hackathon = await this.getHackathonAndVerifyAdmin(user, assignment.submission.hackathonId);
    if (hackathon.judgingLockedAt) throw AppError.businessRule("JUDGING_LOCKED", "Judging is locked.");

    return db.judgeAssignment.update({ where: { id: assignmentId }, data: { finalizedAt: null } });
  }

  static async getProgress(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw AppError.notFound("Not found");
    
    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (!can(user, "hackathon:read", { orgRole: membership?.role })) throw AppError.forbidden("Denied");

    const judges = await db.hackathonStaff.findMany({
      where: { hackathonId, role: "JUDGE" },
      include: {
        user: { select: { name: true, email: true } },
        judgeAssignments: {
          select: { finalizedAt: true },
        },
      },
    });

    return judges.map(j => ({
      staffId: j.id,
      name: j.user?.name || "Unknown",
      email: j.user?.email || j.email,
      totalAssigned: j.judgeAssignments.length,
      totalFinalized: j.judgeAssignments.filter(a => a.finalizedAt !== null).length,
    }));
  }

  static async getLeaderboard(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw AppError.notFound("Not found");
    
    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (!can(user, "hackathon:read", { orgRole: membership?.role })) throw AppError.forbidden("Denied");

    const submissions = await db.submission.findMany({
      where: { hackathonId, status: "SUBMITTED" },
      include: {
        team: { select: { name: true } },
        assignments: {
          where: { finalizedAt: { not: null } },
          include: {
            scores: { include: { criterion: true } },
          },
        },
      },
    });

    const leaderboard = submissions.map(sub => {
      let totalScore = 0;
      let maxPossible = 0;

      sub.assignments.forEach(a => {
        a.scores.forEach(s => {
          totalScore += Number(s.value) * Number(s.criterion.weight);
          maxPossible += s.criterion.maxScore * Number(s.criterion.weight);
        });
      });

      const normalizedScore = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

      return {
        id: sub.id,
        teamName: sub.team.name,
        title: sub.title,
        trackId: sub.trackId,
        score: normalizedScore,
        judgesCount: sub.assignments.length,
      };
    });

    return leaderboard.sort((a, b) => b.score - a.score);
  }

  static async lockJudging(user: AuthUser, hackathonId: string, data: z.infer<typeof LockJudgingSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);

    if (!data.force) {
      const pending = await db.judgeAssignment.count({
        where: { submission: { hackathonId }, finalizedAt: null },
      });
      if (pending > 0) throw AppError.businessRule("INVALID_STATE", `There are ${pending} unfinalized assignments. Force lock if needed.`);
    }

    return db.hackathon.update({
      where: { id: hackathonId },
      data: { judgingLockedAt: new Date() },
    });
  }

  static async publishResults(user: AuthUser, hackathonId: string) {
    const hackathon = await this.getHackathonAndVerifyAdmin(user, hackathonId);
    if (!hackathon.judgingLockedAt) throw AppError.businessRule("INVALID_STATE", "Must lock judging first.");

    return db.hackathon.update({
      where: { id: hackathonId },
      data: { resultsPublishedAt: new Date() },
    });
  }

  static async awardPrize(user: AuthUser, hackathonId: string, prizeId: string, data: z.infer<typeof AwardPrizeSchema>) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);

    return db.prizeAward.create({
      data: {
        prizeId,
        submissionId: data.submissionId,
      },
    });
  }

  // ============================================================
  // JUDGE PORTAL (For individual judges)
  // ============================================================

  static async getMyJudgingHackathons(user: AuthUser) {
    return db.hackathon.findMany({
      where: {
        staff: { some: { userId: user.id, role: "JUDGE", status: "ACTIVE" } },
      },
    });
  }

  static async getMyAssignments(user: AuthUser, hackathonId: string) {
    const staff = await db.hackathonStaff.findFirst({
      where: { hackathonId, userId: user.id, status: "ACTIVE" },
    });
    if (!staff || staff.role !== "JUDGE") throw AppError.forbidden("Not a judge.");

    return db.judgeAssignment.findMany({
      where: { staffId: staff.id },
      include: {
        submission: {
          select: { id: true, anonymousCode: true, title: true, tagline: true, trackId: true },
        },
      },
    });
  }

  static async getAssignment(user: AuthUser, assignmentId: string) {
    const assignment = await db.judgeAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        submission: { include: { media: true } },
        scores: true,
        staff: true,
      },
    });
    if (!assignment) throw AppError.notFound("Assignment not found");
    if (assignment.staff.userId !== user.id) throw AppError.forbidden("Not your assignment");

    // Mask team fields from judge
    (assignment.submission as any).teamId = undefined;

    return assignment;
  }

  static async submitScores(user: AuthUser, assignmentId: string, data: z.infer<typeof SubmitScoresSchema>) {
    const assignment = await db.judgeAssignment.findUnique({
      where: { id: assignmentId },
      include: { staff: true, submission: true },
    });
    if (!assignment) throw AppError.notFound("Assignment not found");
    if (assignment.staff.userId !== user.id) throw AppError.forbidden("Not your assignment");
    if (assignment.finalizedAt !== null) throw AppError.businessRule("INVALID_STATE", "Already finalized.");

    const hackathon = await db.hackathon.findUnique({ where: { id: assignment.submission.hackathonId } });
    if (hackathon?.judgingLockedAt) throw AppError.businessRule("JUDGING_LOCKED", "Judging is locked.");

    return db.$transaction(async (tx) => {
      // Clear old scores
      await tx.score.deleteMany({ where: { assignmentId } });
      
      // Add new scores
      await tx.score.createMany({
        data: data.scores.map(s => ({
          assignmentId,
          criterionId: s.criterionId,
          value: s.value,
          comment: s.comment,
        })),
      });

      return tx.judgeAssignment.update({
        where: { id: assignmentId },
        data: { overallComment: data.overallComment },
      });
    });
  }

  static async finalizeScores(user: AuthUser, assignmentId: string) {
    const assignment = await db.judgeAssignment.findUnique({
      where: { id: assignmentId },
      include: { staff: true, submission: true, scores: true },
    });
    if (!assignment) throw AppError.notFound("Assignment not found");
    if (assignment.staff.userId !== user.id) throw AppError.forbidden("Not your assignment");
    if (assignment.finalizedAt !== null) throw AppError.businessRule("INVALID_STATE", "Already finalized.");

    // Validate all criteria are scored
    const criteriaCount = await db.judgingCriterion.count({ where: { hackathonId: assignment.submission.hackathonId } });
    if (assignment.scores.length < criteriaCount) {
      throw AppError.businessRule("INVALID_STATE", "Must score all criteria before finalizing.");
    }

    return db.judgeAssignment.update({
      where: { id: assignmentId },
      data: { finalizedAt: new Date() },
    });
  }
}
