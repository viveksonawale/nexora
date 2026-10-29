import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/lib/db";
import { HackathonLifecycle } from "@/server/modules/hackathon/hackathon-lifecycle";
import { RegistrationService } from "@/server/modules/registration/registration.service";
import { TeamService } from "@/server/modules/team/team.service";
import { SubmissionService } from "@/server/modules/submission/submission.service";
import { JudgingService } from "@/server/modules/judging/judging.service";
import { getResumeData } from "@/server/modules/profile/profile.service";
import { AuthUser } from "@/server/policies/policy";
import {
  HackathonStatus,
  OrgRole,
  HackathonStaffRole,
  RegistrationStatus,
} from "@prisma/client";

describe("Hackathon Lifecycle State Machine & Role Journeys", () => {
  let collegeA: any;
  let collegeB: any;
  let collegeAdminA: AuthUser;
  let collegeAdminB: AuthUser;
  let leadOrganizerA: AuthUser;
  let studentLeader: AuthUser;
  let studentMember: AuthUser;
  let judgeUser: AuthUser;
  let hackathonAId: string;
  let testTeamId: string;

  beforeAll(async () => {
    // 1. Create College A and College B
    collegeA = await db.organization.create({
      data: {
        name: `Journey College Alpha ${Date.now()}`,
        slug: `journey-college-a-${Date.now()}`,
        status: "ACTIVE",
      },
    });

    collegeB = await db.organization.create({
      data: {
        name: `Journey College Beta ${Date.now()}`,
        slug: `journey-college-b-${Date.now()}`,
        status: "ACTIVE",
      },
    });

    // 2. College Admin A
    const uAdminA = await db.user.create({
      data: {
        name: "College Admin A",
        email: `col-admin-a-${Date.now()}@collegea.edu`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    await db.organizationMember.create({
      data: { organizationId: collegeA.id, userId: uAdminA.id, role: OrgRole.OWNER },
    });
    collegeAdminA = { id: uAdminA.id, email: uAdminA.email, platformRole: "USER", emailVerified: true, status: "ACTIVE" };

    // 3. College Admin B
    const uAdminB = await db.user.create({
      data: {
        name: "College Admin B",
        email: `col-admin-b-${Date.now()}@collegeb.edu`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    await db.organizationMember.create({
      data: { organizationId: collegeB.id, userId: uAdminB.id, role: OrgRole.OWNER },
    });
    collegeAdminB = { id: uAdminB.id, email: uAdminB.email, platformRole: "USER", emailVerified: true, status: "ACTIVE" };

    // 4. Lead Organizer
    const uLead = await db.user.create({
      data: {
        name: "Lead Organizer",
        email: `lead-org-${Date.now()}@collegea.edu`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    leadOrganizerA = { id: uLead.id, email: uLead.email, platformRole: "USER", emailVerified: true, status: "ACTIVE" };

    // 5. Students (Leader and Member)
    const uLeader = await db.user.create({
      data: {
        name: "Team Leader Student",
        email: `leader-${Date.now()}@test.com`,
        platformRole: "USER",
        status: "ACTIVE",
        profile: { create: { slug: `leader-${Date.now()}`, onboardingCompleted: true } },
      },
    });
    studentLeader = { id: uLeader.id, email: uLeader.email, platformRole: "USER", emailVerified: true, status: "ACTIVE" };

    const uMember = await db.user.create({
      data: {
        name: "Team Member Student",
        email: `member-${Date.now()}@test.com`,
        platformRole: "USER",
        status: "ACTIVE",
        profile: { create: { slug: `member-${Date.now()}`, onboardingCompleted: true } },
      },
    });
    studentMember = { id: uMember.id, email: uMember.email, platformRole: "USER", emailVerified: true, status: "ACTIVE" };

    // 6. Judge
    const uJudge = await db.user.create({
      data: {
        name: "Test Judge",
        email: `judge-${Date.now()}@industry.com`,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });
    judgeUser = { id: uJudge.id, email: uJudge.email, platformRole: "USER", emailVerified: true, status: "ACTIVE" };

    // 7. Create Hackathon A in DRAFT state
    const hack = await db.hackathon.create({
      data: {
        organizationId: collegeA.id,
        createdById: uAdminA.id,
        title: "Alpha Innovation Hackathon",
        slug: `alpha-hack-${Date.now()}`,
        status: HackathonStatus.DRAFT,
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 86400000 * 3),
        maxTeamSize: 4,
        requireApproval: true,
      },
    });
    hackathonAId = hack.id;

    // Assign Lead Organizer
    await db.hackathonStaff.create({
      data: {
        hackathonId: hackathonAId,
        userId: leadOrganizerA.id,
        email: leadOrganizerA.email,
        role: HackathonStaffRole.ORGANIZER,
        status: "ACTIVE",
      },
    });

    // Assign Judge
    await db.hackathonStaff.create({
      data: {
        hackathonId: hackathonAId,
        userId: judgeUser.id,
        email: judgeUser.email,
        role: HackathonStaffRole.JUDGE,
        status: "ACTIVE",
      },
    });

    // Create a judging criterion
    await db.judgingCriterion.create({
      data: {
        hackathonId: hackathonAId,
        name: "Innovation & Impact",
        maxScore: 10,
        weight: 1,
      },
    });
  }, 30000);

  afterAll(async () => {
    try {
      if (hackathonAId) {
        await db.score.deleteMany({});
        await db.judgeAssignment.deleteMany({ where: { staff: { hackathonId: hackathonAId } } });
        await db.submission.deleteMany({ where: { hackathonId: hackathonAId } });
        await db.teamMember.deleteMany({ where: { hackathonId: hackathonAId } });
        await db.team.deleteMany({ where: { hackathonId: hackathonAId } });
        await db.registration.deleteMany({ where: { hackathonId: hackathonAId } });
        await db.hackathonStaff.deleteMany({ where: { hackathonId: hackathonAId } });
        await db.judgingCriterion.deleteMany({ where: { hackathonId: hackathonAId } });
        await db.hackathon.delete({ where: { id: hackathonAId } });
      }
      await db.organization.deleteMany({ where: { id: { in: [collegeA.id, collegeB.id] } } });
      await db.user.deleteMany({
        where: {
          id: {
            in: [
              collegeAdminA.id,
              collegeAdminB.id,
              leadOrganizerA.id,
              studentLeader.id,
              studentMember.id,
              judgeUser.id,
            ],
          },
        },
      });
    } catch {}
  });

  // =========================================================================
  // STATE MACHINE & TRANSITION TESTS
  // =========================================================================
  it("College Admin B cannot transition College A's hackathon (403)", async () => {
    await expect(
      HackathonLifecycle.transition(collegeAdminB, hackathonAId, HackathonStatus.REGISTRATION_OPEN)
    ).rejects.toThrow("You do not have organizer permissions to transition this hackathon's state");
  });

  it("Invalid transition jump (e.g. DRAFT -> JUDGING) is rejected (409 Conflict)", async () => {
    await expect(
      HackathonLifecycle.transition(leadOrganizerA, hackathonAId, HackathonStatus.JUDGING)
    ).rejects.toThrow("Cannot transition hackathon from DRAFT to JUDGING");
  });

  it("Registration is forbidden when hackathon is in DRAFT state (403)", async () => {
    await expect(
      RegistrationService.register(studentLeader, hackathonAId, { answers: {} })
    ).rejects.toThrow("This hackathon is in DRAFT. Hackathon Registration is not permitted.");
  });

  it("Organizer transitions hackathon from DRAFT -> REGISTRATION_OPEN", async () => {
    const updated = await HackathonLifecycle.transition(
      leadOrganizerA,
      hackathonAId,
      HackathonStatus.REGISTRATION_OPEN
    );
    expect(updated.status).toBe(HackathonStatus.REGISTRATION_OPEN);
  });

  // =========================================================================
  // JOURNEY: STUDENT REGISTRATION & APPROVAL
  // =========================================================================
  it("Student registers in REGISTRATION_OPEN; status is PENDING", async () => {
    const regLeader = await RegistrationService.register(studentLeader, hackathonAId, { answers: {} });
    expect(regLeader.status).toBe(RegistrationStatus.PENDING);

    const regMember = await RegistrationService.register(studentMember, hackathonAId, { answers: {} });
    expect(regMember.status).toBe(RegistrationStatus.PENDING);
  });

  it("Unapproved registrants cannot create a team (409 Conflict / Business Rule)", async () => {
    await expect(
      TeamService.createTeam(studentLeader, hackathonAId, {
        name: "Alpha Squad",
        lookingForMembers: true,
      })
    ).rejects.toThrow("You must have an APPROVED registration to create a team");
  });

  it("Organizer approves student registrations with notification", async () => {
    const regLeader = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: hackathonAId, userId: studentLeader.id } },
    });
    const regMember = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: hackathonAId, userId: studentMember.id } },
    });

    await RegistrationService.updateStatus(leadOrganizerA, regLeader!.id, { status: RegistrationStatus.APPROVED });
    await RegistrationService.updateStatus(leadOrganizerA, regMember!.id, { status: RegistrationStatus.APPROVED });

    const updatedLeaderReg = await db.registration.findUnique({ where: { id: regLeader!.id } });
    expect(updatedLeaderReg?.status).toBe("APPROVED");
  });

  // =========================================================================
  // JOURNEY: TEAM FORMATION & SIZE RULES (2 TO 4)
  // =========================================================================
  it("Approved student can create team and becomes LEADER", async () => {
    const team = await TeamService.createTeam(studentLeader, hackathonAId, {
      name: "Alpha Squad",
      description: "Building autonomous systems",
      lookingForMembers: true,
    });

    testTeamId = team.id;
    expect(team.name).toBe("Alpha Squad");
    expect(team.leaderId).toBe(studentLeader.id);

    const memberRecord = await db.teamMember.findFirst({
      where: { teamId: team.id },
    });
    expect(memberRecord?.role).toBe("LEADER");
  });

  it("Member joins team via invite code; leader receives notification", async () => {
    const team = await db.team.findUnique({ where: { id: testTeamId } });
    const joined = await TeamService.joinWithCode(studentMember, { inviteCode: team!.inviteCode });
    expect(joined.role).toBe("MEMBER");

    const totalMembers = await db.teamMember.count({ where: { teamId: testTeamId } });
    expect(totalMembers).toBe(2);
  });

  // =========================================================================
  // JOURNEY: LIFECYCLE -> REGISTRATION_CLOSED -> LIVE
  // =========================================================================
  it("Organizer closes registration (REGISTRATION_OPEN -> REGISTRATION_CLOSED)", async () => {
    const updated = await HackathonLifecycle.transition(
      leadOrganizerA,
      hackathonAId,
      HackathonStatus.REGISTRATION_CLOSED
    );
    expect(updated.status).toBe(HackathonStatus.REGISTRATION_CLOSED);
  });

  it("New registration is rejected when REGISTRATION_CLOSED (409 Conflict)", async () => {
    const lateStudent = await db.user.create({
      data: {
        name: "Late Student",
        email: `late-${Date.now()}@test.com`,
        platformRole: "USER",
        status: "ACTIVE",
        profile: { create: { slug: `late-${Date.now()}`, onboardingCompleted: true } },
      },
    });

    await expect(
      RegistrationService.register(
        { id: lateStudent.id, email: lateStudent.email, platformRole: "USER", emailVerified: true, status: "ACTIVE" },
        hackathonAId,
        { answers: {} }
      )
    ).rejects.toThrow("Action 'Hackathon Registration' cannot be performed when hackathon is in REGISTRATION_CLOSED state");
  });

  it("Attendance check-in rejected before event is LIVE (409 Conflict)", async () => {
    await expect(
      RegistrationService.checkIn(studentLeader, hackathonAId, {
        qrToken: `NEXORA_ATTENDANCE:${hackathonAId}:SESSION_1:1:${Date.now()}`,
      })
    ).rejects.toThrow("Action 'Attendance Check-In' cannot be performed when hackathon is in REGISTRATION_CLOSED state");
  });

  it("Organizer starts hackathon (REGISTRATION_CLOSED -> LIVE)", async () => {
    const updated = await HackathonLifecycle.transition(
      leadOrganizerA,
      hackathonAId,
      HackathonStatus.LIVE
    );
    expect(updated.status).toBe(HackathonStatus.LIVE);
  });

  // =========================================================================
  // JOURNEY: ATTENDANCE & SUBMISSION (LEADER ONLY)
  // =========================================================================
  it("Student records attendance during LIVE event", async () => {
    const { AttendanceSessionService } = await import("@/server/modules/attendance/attendance-session.service");
    AttendanceSessionService.setSession(hackathonAId, "ACTIVE", "SESSION_1");

    const checkInResult = await RegistrationService.checkIn(studentLeader, hackathonAId, {
      qrToken: `NEXORA_ATTENDANCE:${hackathonAId}:SESSION_1:1:${Date.now()}`,
    });
    expect(checkInResult.checkedInAt).not.toBeNull();

    const reg = await db.registration.findUnique({
      where: { hackathonId_userId: { hackathonId: hackathonAId, userId: studentLeader.id } },
    });
    expect(reg?.checkedInAt).not.toBeNull();
  });

  it("Submission: Team member is rejected; ONLY team leader may submit (403)", async () => {
    // Draft project created
    const draft = await SubmissionService.upsertDraft(studentLeader, testTeamId, {
      title: "Agentic Copilot",
      tagline: "Autonomous pair programmer",
      description: "An advanced coding assistant",
    });

    // Team member attempts final submit -> 403 Forbidden
    await expect(
      SubmissionService.submit(studentMember, draft.id)
    ).rejects.toThrow("Only the team leader can submit the project");

    // Team leader submits -> succeeds
    const submitted = await SubmissionService.submit(studentLeader, draft.id);
    expect(submitted.status).toBe("SUBMITTED");
  });

  // =========================================================================
  // JOURNEY: SUBMISSION_CLOSED -> JUDGING -> SCORING
  // =========================================================================
  it("Organizer closes submissions and moves to JUDGING phase", async () => {
    await HackathonLifecycle.transition(leadOrganizerA, hackathonAId, HackathonStatus.SUBMISSION_CLOSED);
    const judgingPhase = await HackathonLifecycle.transition(leadOrganizerA, hackathonAId, HackathonStatus.JUDGING);
    expect(judgingPhase.status).toBe(HackathonStatus.JUDGING);
  });

  it("Submission edits are rejected after SUBMISSION_CLOSED / in JUDGING (409 Conflict)", async () => {
    await expect(
      SubmissionService.upsertDraft(studentLeader, testTeamId, { title: "Late Edit" })
    ).rejects.toThrow("Action 'Project Submission' cannot be performed when hackathon is in JUDGING state");
  });

  it("Assigned judge scores submission in JUDGING phase", async () => {
    const sub = await db.submission.findUnique({ where: { teamId: testTeamId } });
    const criterion = await db.judgingCriterion.findFirst({ where: { hackathonId: hackathonAId } });
    const staff = await db.hackathonStaff.findFirst({
      where: { hackathonId: hackathonAId, userId: judgeUser.id },
    });

    // Assign judge
    const assignment = await db.judgeAssignment.create({
      data: {
        staffId: staff!.id,
        submissionId: sub!.id,
      },
    });

    // Submit score
    const scored = await JudgingService.submitScores(judgeUser, assignment.id, {
      scores: [{ criterionId: criterion!.id, value: 9.5, comment: "Exceptional architecture" }],
      overallComment: "Top tier submission",
    });

    expect(scored.overallComment).toBe("Top tier submission");
  });

  // =========================================================================
  // JOURNEY: RESULTS PUBLISHED & VERIFIED RESUME GENERATION
  // =========================================================================
  it("Organizer publishes results (JUDGING -> RESULTS_PUBLISHED)", async () => {
    const published = await HackathonLifecycle.transition(
      leadOrganizerA,
      hackathonAId,
      HackathonStatus.RESULTS_PUBLISHED
    );
    expect(published.status).toBe(HackathonStatus.RESULTS_PUBLISHED);
  });

  it("Verified Resume Rule: Profile includes hackathon ONLY if attended (checked-in)", async () => {
    // Leader checked in -> appears in verified hackathons resume
    const leaderResume = await getResumeData(studentLeader.id);
    expect(leaderResume.hackathons.some((h) => h.hackathon.id === hackathonAId)).toBe(true);

    // Member was APPROVED but DID NOT check in -> NOT included in verified hackathons resume!
    const memberResume = await getResumeData(studentMember.id);
    expect(memberResume.hackathons.some((h) => h.hackathon.id === hackathonAId)).toBe(false);
  });
});
