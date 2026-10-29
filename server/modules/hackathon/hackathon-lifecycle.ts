import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser } from "@/server/policies/policy";
import { HackathonStatus, OrgRole, HackathonStaffRole } from "@prisma/client";
import { queueEmail } from "@/server/modules/email/email.service";

export const ALLOWED_TRANSITIONS: Record<HackathonStatus, HackathonStatus[]> = {
  DRAFT: [HackathonStatus.REGISTRATION_OPEN, HackathonStatus.ARCHIVED, HackathonStatus.CANCELLED],
  REGISTRATION_OPEN: [HackathonStatus.REGISTRATION_CLOSED, HackathonStatus.ARCHIVED, HackathonStatus.CANCELLED],
  REGISTRATION_CLOSED: [HackathonStatus.LIVE, HackathonStatus.REGISTRATION_OPEN, HackathonStatus.ARCHIVED, HackathonStatus.CANCELLED],
  LIVE: [HackathonStatus.SUBMISSION_CLOSED, HackathonStatus.ARCHIVED, HackathonStatus.CANCELLED],
  SUBMISSION_CLOSED: [HackathonStatus.JUDGING, HackathonStatus.LIVE, HackathonStatus.ARCHIVED, HackathonStatus.CANCELLED],
  JUDGING: [HackathonStatus.RESULTS_PUBLISHED, HackathonStatus.SUBMISSION_CLOSED, HackathonStatus.ARCHIVED, HackathonStatus.CANCELLED],
  RESULTS_PUBLISHED: [HackathonStatus.ARCHIVED],
  ARCHIVED: [],
  CANCELLED: [],
  // legacy backward compatibility
  PUBLISHED: [HackathonStatus.REGISTRATION_OPEN, HackathonStatus.LIVE, HackathonStatus.ARCHIVED, HackathonStatus.CANCELLED],
};

export class HackathonLifecycle {
  /**
   * Check if user is an authorized organizer, college admin, or super admin for this hackathon
   */
  static async verifyTransitionAuthority(user: AuthUser, hackathonId: string) {
    if (user.platformRole === "SUPER_ADMIN") return true;

    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      select: { organizationId: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    // Check college admin / owner
    const orgMembership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (orgMembership?.role === OrgRole.OWNER || orgMembership?.role === OrgRole.ADMIN) {
      return true;
    }

    // Check hackathon lead organizer
    const staffEntry = await db.hackathonStaff.findFirst({
      where: {
        hackathonId,
        userId: user.id,
        role: HackathonStaffRole.ORGANIZER,
        status: "ACTIVE",
      },
    });

    if (staffEntry) {
      return true;
    }

    throw AppError.forbidden("You do not have organizer permissions to transition this hackathon's state.");
  }

  /**
   * Central transition function. Mutates the hackathon status if valid, records audit log, and notifies affected users.
   */
  static async transition(user: AuthUser, hackathonId: string, nextState: HackathonStatus, notes?: string) {
    await this.verifyTransitionAuthority(user, hackathonId);

    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      include: { organization: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    const currentState = hackathon.status;

    if (currentState === nextState) {
      return hackathon;
    }

    const validTargets = ALLOWED_TRANSITIONS[currentState] || [];
    if (!validTargets.includes(nextState)) {
      throw AppError.businessRule(
        "INVALID_STATE_TRANSITION",
        `Cannot transition hackathon from ${currentState} to ${nextState}. Allowed transitions: ${validTargets.join(", ") || "None"}.`
      );
    }

    // Transition prerequisites
    if (nextState === HackathonStatus.REGISTRATION_OPEN) {
      if (!hackathon.title || !hackathon.startsAt || !hackathon.endsAt) {
        throw AppError.businessRule("MISSING_REQUIRED_FIELDS", "Hackathon must have title, startsAt, and endsAt dates set before opening registration.");
      }
    }

    if (nextState === HackathonStatus.JUDGING) {
      // Ensure there is at least one criterion or submission
      const criteriaCount = await db.judgingCriterion.count({ where: { hackathonId } });
      if (criteriaCount === 0) {
        throw AppError.businessRule("NO_JUDGING_CRITERIA", "Please define at least one judging criterion before moving to JUDGING.");
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const h = await tx.hackathon.update({
        where: { id: hackathonId },
        data: {
          status: nextState,
          ...(nextState === HackathonStatus.RESULTS_PUBLISHED ? { resultsPublishedAt: new Date() } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          organizationId: hackathon.organizationId,
          hackathonId,
          action: `hackathon.status.${nextState.toLowerCase()}`,
          entityType: "Hackathon",
          entityId: hackathonId,
          metadata: {
            previousState: currentState,
            nextState,
            notes,
          },
        },
      });

      return h;
    });

    // Asynchronous notification handoffs for state changes
    try {
      if (nextState === HackathonStatus.RESULTS_PUBLISHED) {
        // Trigger notification to approved participants
        const registrants = await db.registration.findMany({
          where: { hackathonId, status: "APPROVED" },
          include: { user: { select: { email: true, name: true } } },
          take: 200,
        });

        for (const reg of registrants) {
          await queueEmail({
            toEmail: reg.user.email,
            template: "notification",
            payload: {
              subject: `Results Published for ${hackathon.title}`,
              message: `The results and certificates for ${hackathon.title} are now officially published! Check the results page and your profile to view your verified resume and certificates.`,
              hackathonId,
            },
          });
        }
      }
    } catch {
      // Outbox failure should not abort transaction
    }

    return updated;
  }

  /**
   * Assertion helper for mutating endpoints. Throws 403 or 409 if status does not match.
   */
  static assertState(
    currentStatus: HackathonStatus,
    allowedStates: HackathonStatus[],
    actionName: string
  ) {
    if (currentStatus === HackathonStatus.DRAFT && !allowedStates.includes(HackathonStatus.DRAFT)) {
      throw AppError.forbidden(`This hackathon is in DRAFT. ${actionName} is not permitted.`);
    }

    if (!allowedStates.includes(currentStatus)) {
      throw AppError.conflict(
        `Action '${actionName}' cannot be performed when hackathon is in ${currentStatus} state. Required state(s): ${allowedStates.join(", ")}.`
      );
    }
  }
}
