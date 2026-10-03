import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";

export class DashboardService {
  static async getHackathonDashboard(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (!can(user, "hackathon:read", { orgRole: membership?.role })) {
      throw AppError.forbidden("Permission denied.");
    }

    const [
      totalRegistrations,
      approvedRegistrations,
      checkedIn,
      totalTeams,
      totalSubmissions,
      judgeAssignments,
      finalizedAssignments
    ] = await Promise.all([
      db.registration.count({ where: { hackathonId } }),
      db.registration.count({ where: { hackathonId, status: "APPROVED" } }),
      db.registration.count({ where: { hackathonId, checkedInAt: { not: null } } }),
      db.team.count({ where: { hackathonId } }),
      db.submission.count({ where: { hackathonId, status: "SUBMITTED" } }),
      db.judgeAssignment.count({ where: { submission: { hackathonId } } }),
      db.judgeAssignment.count({ where: { submission: { hackathonId }, finalizedAt: { not: null } } }),
    ]);

    // Grouping registrations by day for chart (simplified)
    const regs = await db.registration.findMany({
      where: { hackathonId },
      select: { createdAt: true },
    });
    
    const registrationsByDay = regs.reduce((acc, curr) => {
      const date = curr.createdAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      stats: {
        totalRegistrations,
        approvedRegistrations,
        checkedIn,
        checkInRate: approvedRegistrations > 0 ? checkedIn / approvedRegistrations : 0,
        totalTeams,
        totalSubmissions,
        judgingProgress: judgeAssignments > 0 ? finalizedAssignments / judgeAssignments : 0,
      },
      charts: {
        registrationsByDay,
      }
    };
  }
}
