import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "crypto";
import { db } from "@/server/lib/db";
import { TeamService } from "@/server/modules/team/team.service";
import { DashboardService } from "@/server/modules/dashboard/dashboard.service";
import { AuthUser } from "@/server/policies/policy";
import { HackathonStatus, RegistrationStatus } from "@prisma/client";
import { AppError } from "@/server/lib/errors";

describe("Student Team Workflows and Dashboard Integration Tests", () => {
  let collegeOrg: any;
  let testHackathon: any;
  let fullHackathon: any;

  let studentLeader: AuthUser;
  let candidateApproved: AuthUser;
  let candidatePending: AuthUser;
  let candidateUnregistered: AuthUser;
  let candidateExtra: AuthUser;

  let studentLeaderDb: any;
  let candidateApprovedDb: any;
  let candidatePendingDb: any;
  let candidateUnregisteredDb: any;
  let candidateExtraDb: any;

  let createdTeamId: string;
  let directInviteToken: string;
  let directInviteId: string;
  let shareLinkToken: string;
  let shareLinkInviteId: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Create Organization
    collegeOrg = await db.organization.create({
      data: {
        name: `Student Workflow College ${timestamp}`,
        slug: `student-workflow-college-${timestamp}`,
        status: "ACTIVE",
      },
    });

    // 2. Create Student Leader
    studentLeaderDb = await db.user.create({
      data: {
        name: "Ada Lovelace",
        email: `ada-leader-${timestamp}@test.edu`,
        platformRole: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            slug: `ada-${timestamp}`,
            headline: "Computer Science Enthusiast",
            bio: "Building future algorithmic breakthroughs",
            skills: {
              create: [
                {
                  skill: {
                    connectOrCreate: {
                      where: { name: "TypeScript" },
                      create: { name: "TypeScript", slug: "typescript" },
                    },
                  },
                },
              ],
            },
            education: {
              create: {
                institution: "MIT",
                degree: "B.S.",
                fieldOfStudy: "Computer Science",
                startYear: 2022,
                endYear: 2026,
              },
            },
          },
        },
      },
      include: { profile: true },
    });
    studentLeader = {
      id: studentLeaderDb.id,
      email: studentLeaderDb.email,
      name: studentLeaderDb.name,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 3. Create Candidate A (Registered and Approved)
    candidateApprovedDb = await db.user.create({
      data: {
        name: "Alan Turing",
        email: `alan-approved-${timestamp}@test.edu`,
        platformRole: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            slug: `alan-${timestamp}`,
            headline: "Cryptanalysis & Logic",
          },
        },
      },
      include: { profile: true },
    });
    candidateApproved = {
      id: candidateApprovedDb.id,
      email: candidateApprovedDb.email,
      name: candidateApprovedDb.name,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 4. Create Candidate B (Registered and Pending)
    candidatePendingDb = await db.user.create({
      data: {
        name: "Grace Hopper",
        email: `grace-pending-${timestamp}@test.edu`,
        platformRole: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            slug: `grace-${timestamp}`,
            headline: "Compiler Architect",
          },
        },
      },
      include: { profile: true },
    });
    candidatePending = {
      id: candidatePendingDb.id,
      email: candidatePendingDb.email,
      name: candidatePendingDb.name,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 5. Create Candidate C (Unregistered)
    candidateUnregisteredDb = await db.user.create({
      data: {
        name: "Claude Shannon",
        email: `claude-unreg-${timestamp}@test.edu`,
        platformRole: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            slug: `claude-${timestamp}`,
            headline: "Information Theorist",
          },
        },
      },
      include: { profile: true },
    });
    candidateUnregistered = {
      id: candidateUnregisteredDb.id,
      email: candidateUnregisteredDb.email,
      name: candidateUnregisteredDb.name,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 6. Create Candidate Extra (For capacity & duplicate tests)
    candidateExtraDb = await db.user.create({
      data: {
        name: "Katherine Johnson",
        email: `katherine-extra-${timestamp}@test.edu`,
        platformRole: "USER",
        status: "ACTIVE",
        profile: {
          create: {
            slug: `katherine-${timestamp}`,
            headline: "Orbital Mechanics",
          },
        },
      },
      include: { profile: true },
    });
    candidateExtra = {
      id: candidateExtraDb.id,
      email: candidateExtraDb.email,
      name: candidateExtraDb.name,
      platformRole: "USER",
      emailVerified: true,
      status: "ACTIVE",
    };

    // 7. Create Primary Hackathon (Max team size = 2)
    testHackathon = await db.hackathon.create({
      data: {
        organizationId: collegeOrg.id,
        createdById: studentLeaderDb.id,
        title: "Future Innovators Hackathon",
        slug: `future-innovators-${timestamp}`,
        status: HackathonStatus.REGISTRATION_OPEN,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 86400000 * 3),
        submissionDeadline: new Date(Date.now() + 86400000 * 2),
        minTeamSize: 1,
        maxTeamSize: 2, // Capacity = 2 (Leader + 1 Member)
        requireApproval: true,
      },
    });

    // Register Student Leader (APPROVED)
    await db.registration.create({
      data: {
        hackathonId: testHackathon.id,
        userId: studentLeader.id,
        status: RegistrationStatus.APPROVED,
        qrToken: randomBytes(16).toString("hex"),
      },
    });

    // Register Candidate A (APPROVED)
    await db.registration.create({
      data: {
        hackathonId: testHackathon.id,
        userId: candidateApproved.id,
        status: RegistrationStatus.APPROVED,
        qrToken: randomBytes(16).toString("hex"),
      },
    });

    // Register Candidate B (PENDING)
    await db.registration.create({
      data: {
        hackathonId: testHackathon.id,
        userId: candidatePending.id,
        status: RegistrationStatus.PENDING,
        qrToken: randomBytes(16).toString("hex"),
      },
    });

    // Register Candidate Extra (APPROVED)
    await db.registration.create({
      data: {
        hackathonId: testHackathon.id,
        userId: candidateExtra.id,
        status: RegistrationStatus.APPROVED,
        qrToken: randomBytes(16).toString("hex"),
      },
    });
  }, 30000);

  afterAll(async () => {
    try {
      if (testHackathon?.id) {
        await db.notification.deleteMany({
          where: {
            userId: {
              in: [
                studentLeader.id,
                candidateApproved.id,
                candidatePending.id,
                candidateUnregistered.id,
                candidateExtra.id,
              ],
            },
          },
        });
        await db.teamInvite.deleteMany({ where: { team: { hackathonId: testHackathon.id } } });
        await db.teamMember.deleteMany({ where: { hackathonId: testHackathon.id } });
        await db.team.deleteMany({ where: { hackathonId: testHackathon.id } });
        await db.registration.deleteMany({ where: { hackathonId: testHackathon.id } });
        await db.hackathon.delete({ where: { id: testHackathon.id } });
      }

      await db.education.deleteMany({
        where: { profileId: studentLeaderDb?.profile?.id },
      });
      await db.profileSkill.deleteMany({
        where: { profileId: studentLeaderDb?.profile?.id },
      });
      await db.profile.deleteMany({
        where: {
          userId: {
            in: [
              studentLeader.id,
              candidateApproved.id,
              candidatePending.id,
              candidateUnregistered.id,
              candidateExtra.id,
            ],
          },
        },
      });
      await db.user.deleteMany({
        where: {
          id: {
            in: [
              studentLeader.id,
              candidateApproved.id,
              candidatePending.id,
              candidateUnregistered.id,
              candidateExtra.id,
            ],
          },
        },
      });
      if (collegeOrg?.id) {
        await db.organization.delete({ where: { id: collegeOrg.id } });
      }
    } catch (err) {
      console.warn("Cleanup warning:", err);
    }
  });

  // =========================================================================
  // 1. Candidate Platform User Search
  // =========================================================================
  describe("Candidate User Platform Search", () => {
    it("searches users with accurate registration and team status flags", async () => {
      const results = await TeamService.searchCandidateUsers(
        studentLeader,
        testHackathon.id,
        "Alan"
      );

      expect(results.length).toBeGreaterThan(0);
      const alan = results.find((u) => u.id === candidateApproved.id);
      expect(alan).toBeDefined();
      expect(alan?.isRegistered).toBe(true);
      expect(alan?.registrationStatus).toBe("APPROVED");
      expect(alan?.isAlreadyInTeam).toBe(false);
    });

    it("identifies unregistered and pending candidates correctly", async () => {
      const resultsPending = await TeamService.searchCandidateUsers(
        studentLeader,
        testHackathon.id,
        "Grace"
      );
      const grace = resultsPending.find((u) => u.id === candidatePending.id);
      expect(grace).toBeDefined();
      expect(grace?.isRegistered).toBe(true);
      expect(grace?.registrationStatus).toBe("PENDING");

      const resultsUnreg = await TeamService.searchCandidateUsers(
        studentLeader,
        testHackathon.id,
        "Claude"
      );
      const claude = resultsUnreg.find((u) => u.id === candidateUnregistered.id);
      expect(claude).toBeDefined();
      expect(claude?.isRegistered).toBe(false);
      expect(claude?.registrationStatus).toBeNull();
    });
  });

  // =========================================================================
  // 2. Workflow A: Team Creation & Inviting Members
  // =========================================================================
  describe("Workflow A: Team Leader Creates Team & Sends Invites", () => {
    it("unapproved student cannot create a team", async () => {
      await expect(
        TeamService.createTeam(candidatePending, testHackathon.id, {
          name: "Pending Squad",
          description: "Not approved yet",
        })
      ).rejects.toThrow();
    });

    it("approved student creates a team and becomes LEADER", async () => {
      const team = await TeamService.createTeam(studentLeader, testHackathon.id, {
        name: "Alpha Cybernetics",
        description: "Autonomous reasoning systems",
      });

      expect(team).toBeDefined();
      expect(team.name).toBe("Alpha Cybernetics");
      expect(team.leaderId).toBe(studentLeader.id);
      expect(team.members.length).toBe(1);
      expect(team.members[0].role).toBe("LEADER");

      createdTeamId = team.id;
    });

    it("team creator cannot create another team in the same hackathon", async () => {
      await expect(
        TeamService.createTeam(studentLeader, testHackathon.id, {
          name: "Alpha Duplicate",
          description: "Another team attempt",
        })
      ).rejects.toThrow();
    });

    it("team leader cannot invite themselves", async () => {
      await expect(
        TeamService.inviteMember(studentLeader, createdTeamId, {
          email: studentLeader.email,
        })
      ).rejects.toThrow(/cannot invite yourself/i);
    });

    it("team leader invites a candidate directly by email with in-app notification", async () => {
      const invite = await TeamService.inviteMember(studentLeader, createdTeamId, {
        email: candidateApproved.email,
        role: "MEMBER",
      });

      expect(invite).toBeDefined();
      expect(invite.status).toBe("PENDING");
      expect(invite.invitedUserId).toBe(candidateApproved.id);
      expect(invite.tokenHash).toBeTruthy();

      directInviteToken = invite.tokenHash;
      directInviteId = invite.id;

      // Verify in-app notification was dispatched to candidateApproved
      const notification = await db.notification.findFirst({
        where: {
          userId: candidateApproved.id,
          type: "TEAM_INVITATION",
        },
      });
      expect(notification).toBeDefined();
      expect(notification?.body).toContain("Alpha Cybernetics");
    });

    it("prevents sending a duplicate active invite to the same student", async () => {
      await expect(
        TeamService.inviteMember(studentLeader, createdTeamId, {
          email: candidateApproved.email,
        })
      ).rejects.toThrow(/active invitation has already been sent/i);
    });

    it("team leader generates a unique shareable invite link", async () => {
      const shareInvite = await TeamService.createInviteLink(studentLeader, createdTeamId);

      expect(shareInvite).toBeDefined();
      expect(shareInvite.status).toBe("PENDING");
      expect(shareInvite.invitedUserId).toBeNull();
      expect(shareInvite.email).toBeNull();
      expect(shareInvite.tokenHash).toBeTruthy();

      shareLinkToken = shareInvite.tokenHash;
      shareLinkInviteId = shareInvite.id;
    });

    it("team leader retrieves all team invites (both direct and share links)", async () => {
      const teamInvites = await TeamService.getTeamInvitesForTeam(studentLeader, createdTeamId);
      expect(teamInvites.length).toBe(2);

      const direct = teamInvites.find((i) => i.id === directInviteId);
      const share = teamInvites.find((i) => i.id === shareLinkInviteId);

      expect(direct).toBeDefined();
      expect(direct?.invitedUser?.id).toBe(candidateApproved.id);

      expect(share).toBeDefined();
      expect(share?.invitedUser).toBeNull();
    });

    it("team leader can resend an invitation, updating expiration", async () => {
      const resent = await TeamService.resendInvite(studentLeader, directInviteId);
      expect(resent.status).toBe("PENDING");
      expect(new Date(resent.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it("team leader can revoke a shareable link", async () => {
      // Create a temporary link to revoke
      const tempLink = await TeamService.createInviteLink(studentLeader, createdTeamId);
      const revokeResult = await TeamService.revokeInvite(studentLeader, tempLink.id);
      expect(revokeResult.success).toBe(true);

      const revokedRecord = await db.teamInvite.findUnique({ where: { id: tempLink.id } });
      expect(revokedRecord?.status).toBe("REVOKED");

      // Verify token inspection reports REVOKED
      const inspection = await TeamService.getInviteByToken(candidateApproved, tempLink.tokenHash);
      expect(inspection.valid).toBe(false);
      expect(inspection.error).toBe("REVOKED");
    });
  });

  // =========================================================================
  // 3. Workflow B: Joining via Invitation Link / Token
  // =========================================================================
  describe("Workflow B: Student Inspects & Joins Team via Token", () => {
    it("public inspection of valid invite returns team and hackathon info", async () => {
      const inspection = await TeamService.getInviteByToken(null, shareLinkToken);

      expect(inspection.valid).toBe(true);
      expect(inspection.team.name).toBe("Alpha Cybernetics");
      expect(inspection.team.leader.name).toBe("Ada Lovelace");
      expect(inspection.hackathon.title).toBe("Future Innovators Hackathon");
      expect(inspection.userStatus.isAuthenticated).toBe(false);
    });

    it("unregistered student inspection marks REGISTRATION_REQUIRED", async () => {
      const inspection = await TeamService.getInviteByToken(
        candidateUnregistered,
        shareLinkToken
      );

      expect(inspection.valid).toBe(true);
      expect(inspection.userStatus.isAuthenticated).toBe(true);
      expect(inspection.userStatus.isRegistered).toBe(false);
      expect(inspection.userStatus.canAccept).toBe(false);
      expect(inspection.userStatus.reason).toBe("REGISTRATION_REQUIRED");
    });

    it("unregistered student cannot accept invitation", async () => {
      await expect(
        TeamService.acceptInviteByToken(candidateUnregistered, shareLinkToken)
      ).rejects.toThrow(/You must have an APPROVED registration/i);
    });

    it("pending student inspection marks REGISTRATION_PENDING", async () => {
      const inspection = await TeamService.getInviteByToken(candidatePending, shareLinkToken);

      expect(inspection.valid).toBe(true);
      expect(inspection.userStatus.isRegistered).toBe(true);
      expect(inspection.userStatus.registrationStatus).toBe("PENDING");
      expect(inspection.userStatus.canAccept).toBe(false);
      expect(inspection.userStatus.reason).toBe("REGISTRATION_PENDING");
    });

    it("pending student cannot accept invitation", async () => {
      await expect(
        TeamService.acceptInviteByToken(candidatePending, shareLinkToken)
      ).rejects.toThrow(/You must have an APPROVED registration/i);
    });

    it("approved candidate inspection confirms eligibility to accept", async () => {
      const inspection = await TeamService.getInviteByToken(candidateApproved, shareLinkToken);

      expect(inspection.valid).toBe(true);
      expect(inspection.userStatus.isRegistered).toBe(true);
      expect(inspection.userStatus.registrationStatus).toBe("APPROVED");
      expect(inspection.userStatus.canAccept).toBe(true);
    });

    it("approved candidate accepts invitation and joins the team", async () => {
      const member = await TeamService.acceptInviteByToken(candidateApproved, directInviteToken);

      expect(member).toBeDefined();
      expect(member.teamId).toBe(createdTeamId);
      expect(member.role).toBe("MEMBER");

      // Verify leader received notification that candidate accepted
      const notif = await db.notification.findFirst({
        where: {
          userId: studentLeader.id,
          type: "TEAM_INVITATION_ACCEPTED",
        },
      });
      expect(notif).toBeDefined();
      expect(notif?.body).toContain("Alan Turing");
    });

    it("candidate already in team cannot join again (ALREADY_IN_TEAM)", async () => {
      await expect(
        TeamService.acceptInviteByToken(candidateApproved, shareLinkToken)
      ).rejects.toThrow(/already a member of this team/i);
    });

    it("enforces max team capacity (TEAM_FULL) when limit is reached", async () => {
      // Max team size was set to 2. We now have Leader + Candidate Approved (2 members).
      // Candidate Extra attempts to accept the share link.
      await expect(
        TeamService.acceptInviteByToken(candidateExtra, shareLinkToken)
      ).rejects.toThrow(/reached its maximum capacity/i);

      // Verify inspection reports TEAM_FULL
      const inspection = await TeamService.getInviteByToken(candidateExtra, shareLinkToken);
      expect(inspection.userStatus.canAccept).toBe(false);
      expect(inspection.userStatus.reason).toBe("TEAM_FULL");
    });

    it("student can decline an invitation", async () => {
      // Create a new direct invite for Candidate Extra
      const declineInvite = await db.teamInvite.create({
        data: {
          teamId: createdTeamId,
          invitedById: studentLeader.id,
          invitedUserId: candidateExtra.id,
          tokenHash: `decline-test-token-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          expiresAt: new Date(Date.now() + 86400000),
          status: "PENDING",
        },
      });

      const declined = await TeamService.declineInviteByToken(
        candidateExtra,
        declineInvite.tokenHash
      );
      expect(declined.status).toBe("DECLINED");

      // Verify leader received decline notification
      const notif = await db.notification.findFirst({
        where: {
          userId: studentLeader.id,
          type: "TEAM_INVITATION_DECLINED",
        },
      });
      expect(notif).toBeDefined();
      expect(notif?.body).toContain("Katherine Johnson");

      // Subsequent inspection shows DECLINED
      const inspectDeclined = await TeamService.getInviteByToken(
        candidateExtra,
        declineInvite.tokenHash
      );
      expect(inspectDeclined.valid).toBe(false);
      expect(inspectDeclined.error).toBe("DECLINED");
    });
  });

  // =========================================================================
  // 4. Complete Student Dashboard Data Service
  // =========================================================================
  describe("Complete Student Dashboard Metrics and Aggregations", () => {
    it("returns comprehensive dashboard data with real backend statistics", async () => {
      const dashboard = await DashboardService.getStudentDashboard(studentLeader);

      expect(dashboard).toBeDefined();
      expect(dashboard.user.id).toBe(studentLeader.id);
      expect(dashboard.user.name).toBe("Ada Lovelace");

      // Verify real stats
      expect(dashboard.stats.totalHackathonsRegistered).toBe(1);
      expect(dashboard.stats.activeHackathons).toBe(1);
      expect(dashboard.stats.hackathonsWon).toBe(0);
      expect(dashboard.stats.totalCertificates).toBe(0);

      // Verify profile and resume completeness calculation
      expect(dashboard.completeness).toBeDefined();
      expect(typeof dashboard.completeness.score).toBe("number");
      expect(dashboard.completeness.score).toBeGreaterThan(0);
      expect(Array.isArray(dashboard.completeness.missing)).toBe(true);

      // Verify upcoming deadlines
      expect(dashboard.upcomingDeadlines.length).toBeGreaterThan(0);
      const deadline = dashboard.upcomingDeadlines.find(
        (d) => d.hackathonId === testHackathon.id
      );
      expect(deadline).toBeDefined();
      expect(deadline?.hackathonTitle).toBe("Future Innovators Hackathon");

      // Verify recent notifications
      expect(dashboard.recentNotifications.length).toBeGreaterThan(0);
    });

    it("getMyTeams returns correct teams for leader with invites", async () => {
      const myTeams = await TeamService.getMyTeams(studentLeader);
      expect(myTeams.length).toBe(1);

      const team = myTeams[0];
      expect(team.name).toBe("Alpha Cybernetics");
      expect(team.isLeader).toBe(true);
      expect(team.myRole).toBe("LEADER");
      expect(team.members.length).toBe(2);
      expect(team.invites.length).toBeGreaterThan(0);
    });

    it("getMyTeams returns correct teams for accepted member", async () => {
      const myTeams = await TeamService.getMyTeams(candidateApproved);
      expect(myTeams.length).toBe(1);

      const team = myTeams[0];
      expect(team.name).toBe("Alpha Cybernetics");
      expect(team.isLeader).toBe(false);
      expect(team.myRole).toBe("MEMBER");
      expect(team.leader.name).toBe("Ada Lovelace");
      // Ordinary members should not receive administrative invites list
      expect(team.invites.length).toBe(0);
    });

    it("getMyInvites retrieves user invitations with history support", async () => {
      const allInvites = await TeamService.getMyInvites(candidateApproved, true);
      expect(allInvites.length).toBe(1);
      expect(allInvites[0].status).toBe("ACCEPTED");
      expect(allInvites[0].team.name).toBe("Alpha Cybernetics");
    });
  });
});
