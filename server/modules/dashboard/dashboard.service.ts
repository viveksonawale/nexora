import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { calculateCompleteness } from "@/server/modules/profile/profile.service";

export class DashboardService {
  static async getStudentDashboard(user: AuthUser) {
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      include: {
        profile: {
          include: {
            education: true,
            skills: { include: { skill: true } },
            projects: true,
            experiences: true,
            achievements: true,
          },
        },
      },
    });

    const profile = userRecord?.profile;
    const completeness = profile
      ? calculateCompleteness(profile)
      : { score: 0, missing: ["Complete your profile"] };

    const [
      registrations,
      certificatesCount,
      prizeAwardsCount,
      pendingInvites,
      unreadNotificationsCount,
      recentNotifications,
    ] = await Promise.all([
      db.registration.findMany({
        where: { userId: user.id },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              bannerUrl: true,
              status: true,
              mode: true,
              registrationClosesAt: true,
              startsAt: true,
              endsAt: true,
              submissionDeadline: true,
              judgingStartsAt: true,
              judgingEndsAt: true,
            },
          },
          teamMember: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  submission: {
                    select: { id: true, title: true, status: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.certificate.count({ where: { userId: user.id } }),
      db.prizeAward.count({
        where: {
          submission: {
            team: {
              members: {
                some: { registration: { userId: user.id } },
              },
            },
          },
        },
      }),
      db.teamInvite.findMany({
        where: {
          OR: [
            { invitedUserId: user.id },
            { email: user.email },
          ],
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        include: {
          team: {
            include: {
              hackathon: { select: { id: true, title: true, slug: true } },
              leader: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
              _count: { select: { members: true } },
            },
          },
          invitedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.notification.count({ where: { userId: user.id, readAt: null } }),
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalHackathonsRegistered = registrations.length;
    const activeHackathons = registrations.filter((r) =>
      ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "LIVE", "SUBMISSION_CLOSED", "JUDGING"].includes(r.hackathon.status)
    ).length;

    const winnerCertCount = await db.certificate.count({
      where: { userId: user.id, type: "WINNER" },
    });
    const totalWon = Math.max(prizeAwardsCount, winnerCertCount);

    const now = new Date();
    const deadlines: Array<{
      id: string;
      hackathonId: string;
      hackathonTitle: string;
      type: string;
      label: string;
      date: Date;
      isPast: boolean;
    }> = [];

    for (const reg of registrations) {
      const h = reg.hackathon;
      if (h.registrationClosesAt && new Date(h.registrationClosesAt) > now) {
        deadlines.push({
          id: `${h.id}-reg-close`,
          hackathonId: h.id,
          hackathonTitle: h.title,
          type: "REGISTRATION_CLOSE",
          label: "Registration Closes",
          date: new Date(h.registrationClosesAt),
          isPast: false,
        });
      }
      if (h.startsAt && new Date(h.startsAt) > now) {
        deadlines.push({
          id: `${h.id}-starts`,
          hackathonId: h.id,
          hackathonTitle: h.title,
          type: "HACKATHON_START",
          label: "Event Kickoff",
          date: new Date(h.startsAt),
          isPast: false,
        });
      }
      if (h.submissionDeadline && new Date(h.submissionDeadline) > now) {
        deadlines.push({
          id: `${h.id}-submission`,
          hackathonId: h.id,
          hackathonTitle: h.title,
          type: "SUBMISSION_DEADLINE",
          label: "Project Submission Deadline",
          date: new Date(h.submissionDeadline),
          isPast: false,
        });
      }
      if (h.endsAt && new Date(h.endsAt) > now) {
        deadlines.push({
          id: `${h.id}-ends`,
          hackathonId: h.id,
          hackathonTitle: h.title,
          type: "EVENT_END",
          label: "Hackathon Ends",
          date: new Date(h.endsAt),
          isPast: false,
        });
      }
    }

    deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());

    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      link?: string;
    }> = [];

    for (const reg of registrations.slice(0, 5)) {
      activities.push({
        id: `reg-${reg.id}`,
        type: "REGISTRATION",
        title: `Registered for ${reg.hackathon.title}`,
        description: `Status: ${reg.status}`,
        timestamp: reg.createdAt,
        link: `/hackathons/${reg.hackathon.id}`,
      });
      if (reg.teamMember) {
        activities.push({
          id: `tm-${reg.teamMember.id}`,
          type: "TEAM_JOINED",
          title: `Joined team "${reg.teamMember.team.name}"`,
          description: `Hackathon: ${reg.hackathon.title}`,
          timestamp: reg.teamMember.joinedAt || reg.createdAt,
          link: `/student/teams`,
        });
      }
    }

    for (const notif of recentNotifications) {
      if (!activities.some((a) => a.id === `notif-${notif.id}`)) {
        activities.push({
          id: `notif-${notif.id}`,
          type: notif.type,
          title: notif.title,
          description: notif.body || "",
          timestamp: notif.createdAt,
        });
      }
    }

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      user: {
        id: user.id,
        name: userRecord?.name || user.name || "Student",
        email: userRecord?.email || user.email,
        avatarUrl: profile?.avatarUrl || null,
        headline: profile?.headline || null,
        slug: profile?.slug || null,
      },
      completeness: {
        score: completeness?.score ?? 0,
        missing: Array.isArray(completeness?.missing) ? completeness.missing : [],
        isComplete: (completeness?.score ?? 0) === 100,
      },
      stats: {
        totalHackathonsRegistered,
        activeHackathons,
        hackathonsWon: totalWon,
        totalCertificates: certificatesCount,
      },
      pendingInvites: pendingInvites.map((inv) => ({
        id: inv.id,
        token: inv.tokenHash,
        teamId: inv.teamId,
        teamName: inv.team.name,
        hackathonId: inv.team.hackathon.id,
        hackathonTitle: inv.team.hackathon.title,
        hackathonSlug: inv.team.hackathon.slug,
        inviterName: inv.invitedBy?.name || "Team Leader",
        leaderName: inv.team.leader.name,
        leaderAvatarUrl: inv.team.leader.profile?.avatarUrl,
        memberCount: inv.team._count.members,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
      unreadNotificationsCount,
      recentNotifications,
      upcomingDeadlines: deadlines.slice(0, 5),
      recentActivity: activities.slice(0, 8),
    };
  }

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
