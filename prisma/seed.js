require("dotenv").config();
const { PrismaClient, PlatformRole, OrganizationType, OrganizationStatus, OrgRole, HackathonStaffRole, StaffStatus, HackathonMode, HackathonStatus, Visibility, RegistrationStatus, TeamRole, SubmissionStatus } = require("@prisma/client");
const argon2 = require("argon2");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function seedDatabase() {
  console.log("Seeding Nexora database with all roles and test accounts...");

  const defaultPassword = "TestPass123!";
  const passwordHash = await hashPassword(defaultPassword);

  // 1. Super Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.SUPER_ADMIN, emailVerifiedAt: new Date() },
    create: {
      email: "admin@nexora.app",
      name: "Nexora Super Admin",
      passwordHash,
      platformRole: PlatformRole.SUPER_ADMIN,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "super-admin",
          headline: "Platform Administrator",
          bio: "Managing the Nexora platform.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 1b. Support Admin
  const supportAdmin = await prisma.user.upsert({
    where: { email: "support@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.SUPPORT_ADMIN, emailVerifiedAt: new Date() },
    create: {
      email: "support@nexora.app",
      name: "Sam Support",
      passwordHash,
      platformRole: PlatformRole.SUPPORT_ADMIN,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "sam-support",
          headline: "Platform Support Specialist",
          bio: "Assisting participants and organizers with access and event support.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 2. Organizer (Org Owner)
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.USER, emailVerifiedAt: new Date() },
    create: {
      email: "organizer@nexora.app",
      name: "Olivia Organizer",
      passwordHash,
      platformRole: PlatformRole.USER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "olivia-organizer",
          headline: "Lead Hackathon Director",
          bio: "Organizing global engineering events.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 3. Org Admin
  const orgAdmin = await prisma.user.upsert({
    where: { email: "orgadmin@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.USER, emailVerifiedAt: new Date() },
    create: {
      email: "orgadmin@nexora.app",
      name: "Arthur Admin",
      passwordHash,
      platformRole: PlatformRole.USER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "arthur-admin",
          headline: "Organization Co-Lead",
          bio: "Managing organization logistics.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 4. Org Staff
  const orgStaff = await prisma.user.upsert({
    where: { email: "orgstaff@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.USER, emailVerifiedAt: new Date() },
    create: {
      email: "orgstaff@nexora.app",
      name: "Sarah Staff",
      passwordHash,
      platformRole: PlatformRole.USER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "sarah-staff",
          headline: "Event Coordinator",
          bio: "Coordinating events.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 5. Judge
  const judge = await prisma.user.upsert({
    where: { email: "judge@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.USER, emailVerifiedAt: new Date() },
    create: {
      email: "judge@nexora.app",
      name: "Julian Judge",
      passwordHash,
      platformRole: PlatformRole.USER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "julian-judge",
          headline: "Senior Software Architect & Judge",
          bio: "Evaluating architecture and code quality.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 6. Mentor
  const mentor = await prisma.user.upsert({
    where: { email: "mentor@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.USER, emailVerifiedAt: new Date() },
    create: {
      email: "mentor@nexora.app",
      name: "Marcus Mentor",
      passwordHash,
      platformRole: PlatformRole.USER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "marcus-mentor",
          headline: "Tech Mentor & Community Guide",
          bio: "Guiding hacker teams to victory.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 7. Volunteer
  const volunteer = await prisma.user.upsert({
    where: { email: "volunteer@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.USER, emailVerifiedAt: new Date() },
    create: {
      email: "volunteer@nexora.app",
      name: "Valerie Volunteer",
      passwordHash,
      platformRole: PlatformRole.USER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "valerie-volunteer",
          headline: "Campus Operations Volunteer",
          bio: "Facilitating participant check-in.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 8. Hacker / Participant (Leader)
  const hacker = await prisma.user.upsert({
    where: { email: "hacker@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.USER, emailVerifiedAt: new Date() },
    create: {
      email: "hacker@nexora.app",
      name: "Henry Hacker",
      passwordHash,
      platformRole: PlatformRole.USER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "henry-hacker",
          headline: "Full-Stack Builder & Team Captain",
          bio: "Building innovative web and AI solutions.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 9. Hacker / Participant (Member)
  const member = await prisma.user.upsert({
    where: { email: "member@nexora.app" },
    update: { passwordHash, platformRole: PlatformRole.USER, emailVerifiedAt: new Date() },
    create: {
      email: "member@nexora.app",
      name: "Mia Member",
      passwordHash,
      platformRole: PlatformRole.USER,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          slug: "mia-member",
          headline: "Frontend Engineer",
          bio: "UI/UX enthusiast and hacker.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // 10. Organization
  const org = await prisma.organization.upsert({
    where: { slug: "nexus-labs" },
    update: { status: OrganizationStatus.ACTIVE },
    create: {
      name: "Nexus Labs",
      slug: "nexus-labs",
      type: OrganizationType.COMMUNITY,
      status: OrganizationStatus.ACTIVE,
      description: "Premier global developer guild and innovation lab.",
      websiteUrl: "https://nexora.app",
      city: "San Francisco",
      country: "USA",
    },
  });

  // Link Organization Members
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: organizer.id } },
    update: { role: OrgRole.OWNER },
    create: { organizationId: org.id, userId: organizer.id, role: OrgRole.OWNER },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: orgAdmin.id } },
    update: { role: OrgRole.ADMIN },
    create: { organizationId: org.id, userId: orgAdmin.id, role: OrgRole.ADMIN },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: orgStaff.id } },
    update: { role: OrgRole.STAFF },
    create: { organizationId: org.id, userId: orgStaff.id, role: OrgRole.STAFF },
  });

  // 11. Hackathons
  const now = new Date();
  const liveHackathon = await prisma.hackathon.upsert({
    where: { slug: "techfest-2026" },
    update: {
      status: HackathonStatus.PUBLISHED,
      startsAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
    create: {
      organizationId: org.id,
      createdById: organizer.id,
      slug: "techfest-2026",
      title: "Techfest 2026",
      tagline: "Global Flagship Software & AI Championship",
      description: "Join top developers from across the world in building breakthrough solutions with AI, Web3, and cloud infrastructure.",
      mode: HackathonMode.HYBRID,
      city: "San Francisco",
      country: "USA",
      status: HackathonStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
      startsAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      registrationOpensAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      registrationClosesAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      submissionDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      minTeamSize: 1,
      maxTeamSize: 4,
      blindJudging: true,
      tags: ["AI", "Next.js", "Fullstack", "PostgreSQL"],
    },
  });

  // Create Tracks
  const aiTrack = await prisma.track.upsert({
    where: { hackathonId_name: { hackathonId: liveHackathon.id, name: "AI Innovation" } },
    update: {},
    create: {
      hackathonId: liveHackathon.id,
      name: "AI Innovation",
      description: "Autonomous agents, machine learning, and generative applications.",
    },
  });

  // Create Criteria
  await prisma.judgingCriterion.upsert({
    where: { hackathonId_name: { hackathonId: liveHackathon.id, name: "Technical Execution" } },
    update: {},
    create: {
      hackathonId: liveHackathon.id,
      name: "Technical Execution",
      description: "Code quality, architecture, and engineering complexity.",
      maxScore: 10,
      weight: 1.5,
    },
  });

  // Staff Roles for live hackathon
  await prisma.hackathonStaff.upsert({
    where: { hackathonId_email_role: { hackathonId: liveHackathon.id, email: judge.email, role: HackathonStaffRole.JUDGE } },
    update: { status: StaffStatus.ACTIVE, userId: judge.id },
    create: {
      hackathonId: liveHackathon.id,
      userId: judge.id,
      email: judge.email,
      role: HackathonStaffRole.JUDGE,
      status: StaffStatus.ACTIVE,
    },
  });

  await prisma.hackathonStaff.upsert({
    where: { hackathonId_email_role: { hackathonId: liveHackathon.id, email: mentor.email, role: HackathonStaffRole.MENTOR } },
    update: { status: StaffStatus.ACTIVE, userId: mentor.id },
    create: {
      hackathonId: liveHackathon.id,
      userId: mentor.id,
      email: mentor.email,
      role: HackathonStaffRole.MENTOR,
      status: StaffStatus.ACTIVE,
    },
  });

  await prisma.hackathonStaff.upsert({
    where: { hackathonId_email_role: { hackathonId: liveHackathon.id, email: volunteer.email, role: HackathonStaffRole.VOLUNTEER } },
    update: { status: StaffStatus.ACTIVE, userId: volunteer.id },
    create: {
      hackathonId: liveHackathon.id,
      userId: volunteer.id,
      email: volunteer.email,
      role: HackathonStaffRole.VOLUNTEER,
      status: StaffStatus.ACTIVE,
    },
  });

  // Registrations
  const hackerReg = await prisma.registration.upsert({
    where: { hackathonId_userId: { hackathonId: liveHackathon.id, userId: hacker.id } },
    update: { status: RegistrationStatus.APPROVED },
    create: {
      hackathonId: liveHackathon.id,
      userId: hacker.id,
      status: RegistrationStatus.APPROVED,
      qrToken: "QR-" + crypto.randomBytes(8).toString("hex").toUpperCase(),
      checkedInAt: new Date(),
    },
  });

  const memberReg = await prisma.registration.upsert({
    where: { hackathonId_userId: { hackathonId: liveHackathon.id, userId: member.id } },
    update: { status: RegistrationStatus.APPROVED },
    create: {
      hackathonId: liveHackathon.id,
      userId: member.id,
      status: RegistrationStatus.APPROVED,
      qrToken: "QR-" + crypto.randomBytes(8).toString("hex").toUpperCase(),
      checkedInAt: new Date(),
    },
  });

  // Team
  const team = await prisma.team.upsert({
    where: { hackathonId_name: { hackathonId: liveHackathon.id, name: "CodeCraft" } },
    update: {},
    create: {
      hackathonId: liveHackathon.id,
      leaderId: hacker.id,
      name: "CodeCraft",
      description: "Building autonomous systems for real-world operations.",
      inviteCode: "CRAFT-2026",
    },
  });

  // Team Members
  await prisma.teamMember.upsert({
    where: { registrationId_hackathonId: { registrationId: hackerReg.id, hackathonId: liveHackathon.id } },
    update: {},
    create: {
      hackathonId: liveHackathon.id,
      teamId: team.id,
      registrationId: hackerReg.id,
      role: TeamRole.LEADER,
    },
  });

  await prisma.teamMember.upsert({
    where: { registrationId_hackathonId: { registrationId: memberReg.id, hackathonId: liveHackathon.id } },
    update: {},
    create: {
      hackathonId: liveHackathon.id,
      teamId: team.id,
      registrationId: memberReg.id,
      role: TeamRole.MEMBER,
    },
  });

  // Submission
  const submission = await prisma.submission.upsert({
    where: { hackathonId_anonymousCode: { hackathonId: liveHackathon.id, anonymousCode: "SUB-801" } },
    update: {},
    create: {
      hackathonId: liveHackathon.id,
      teamId: team.id,
      trackId: aiTrack.id,
      anonymousCode: "SUB-801",
      title: "Nexora Agent Studio",
      tagline: "Autonomous Agent Orchestration and Observability",
      description: "An end-to-end framework for collaborative multi-agent execution.",
      repoUrl: "https://github.com/nexora/agent-studio",
      demoUrl: "https://nexora.app/demo",
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  // Staff Judge Assignment
  const judgeStaff = await prisma.hackathonStaff.findFirst({
    where: { hackathonId: liveHackathon.id, userId: judge.id, role: HackathonStaffRole.JUDGE },
  });

  if (judgeStaff) {
    await prisma.judgeAssignment.upsert({
      where: { staffId_submissionId: { staffId: judgeStaff.id, submissionId: submission.id } },
      update: {},
      create: {
        staffId: judgeStaff.id,
        submissionId: submission.id,
      },
    });
  }

  // Second upcoming hackathon
  await prisma.hackathon.upsert({
    where: { slug: "global-cyber-hack-2026" },
    update: {},
    create: {
      organizationId: org.id,
      createdById: organizer.id,
      slug: "global-cyber-hack-2026",
      title: "Global Cyber Hack 2026",
      tagline: "Next Generation Cybersecurity & Cloud Resilience",
      description: "Solve high-stakes security challenges, reverse engineering, and threat response.",
      mode: HackathonMode.ONLINE,
      status: HackathonStatus.PUBLISHED,
      visibility: Visibility.PUBLIC,
      startsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      minTeamSize: 1,
      maxTeamSize: 4,
    },
  });

  // Seed Roles and Permissions
  console.log("Seeding RBAC roles and permissions...");
  const SYSTEM_PERMISSIONS = [
    { code: "platform.admin", name: "Platform Administration", category: "PLATFORM", description: "Full super administrator access to all platform resources" },
    { code: "platform.support", name: "Platform Support", category: "PLATFORM", description: "Access support tools, view user records and assist troubleshooting" },
    { code: "platform.users.manage", name: "Manage Platform Users", category: "PLATFORM", description: "Modify user platform roles, suspend and reactivate accounts" },
    { code: "platform.roles.manage", name: "Manage Roles & Permissions", category: "PLATFORM", description: "Assign and revoke platform-wide and event roles" },
    { code: "hackathon.create", name: "Create Hackathon", category: "HACKATHON", description: "Create new hackathon events under an organization" },
    { code: "hackathon.read", name: "View Hackathon Details", category: "HACKATHON", description: "View internal hackathon details, overview and metrics" },
    { code: "hackathon.update", name: "Update Hackathon Settings", category: "HACKATHON", description: "Edit event settings, dates, tracks, rules, and FAQs" },
    { code: "hackathon.publish", name: "Publish Hackathon", category: "HACKATHON", description: "Publish, pause, or change event visibility" },
    { code: "hackathon.archive", name: "Archive Hackathon", category: "HACKATHON", description: "Archive or close completed hackathons" },
    { code: "hackathon.delete", name: "Delete Hackathon", category: "HACKATHON", description: "Permanently delete an event" },
    { code: "hackathon.staff.manage", name: "Manage Staff & Roles", category: "HACKATHON", description: "Assign, invite, and revoke event staff roles" },
    { code: "registration.view", name: "View Registrations", category: "REGISTRATION", description: "Search, filter, and inspect participant registrations" },
    { code: "registration.review", name: "Review Registrations", category: "REGISTRATION", description: "Approve, reject, or waitlist participant applications" },
    { code: "registration.checkin", name: "Check-in Participants", category: "REGISTRATION", description: "Scan QR codes and record event-day attendance" },
    { code: "registration.export", name: "Export Registration Data", category: "REGISTRATION", description: "Export participant and attendee lists" },
    { code: "team.manage", name: "Manage Teams", category: "SUBMISSION", description: "Inspect team membership, change leader, or manage rosters" },
    { code: "submission.view", name: "View Project Submissions", category: "SUBMISSION", description: "View submitted project repositories, links, and documents" },
    { code: "submission.review", name: "Review Project Eligibility", category: "SUBMISSION", description: "Perform compliance checks and flag rule violations" },
    { code: "submission.manage", name: "Manage Submissions", category: "SUBMISSION", description: "Disqualify, reinstate, or edit project metadata" },
    { code: "judging.assign", name: "Assign Judges", category: "JUDGING", description: "Distribute submissions across judges manually or automatically" },
    { code: "judging.rubric.manage", name: "Manage Scoring Rubrics", category: "JUDGING", description: "Configure judging criteria, score ranges, and weights" },
    { code: "judging.evaluate", name: "Evaluate Assigned Projects", category: "JUDGING", description: "Submit scores, ratings, and feedback for assigned projects" },
    { code: "judging.aggregate.view", name: "View Aggregate Scores", category: "JUDGING", description: "Inspect leaderboards, average scores, and judge progress" },
    { code: "judging.lock", name: "Lock / Finalize Judging", category: "JUDGING", description: "Freeze score adjustments and finalize evaluations" },
    { code: "results.publish", name: "Publish Results", category: "JUDGING", description: "Approve and publish winners, awards, and certificates" },
    { code: "mentor.sessions.manage", name: "Manage Mentoring Sessions", category: "COMMUNICATION", description: "Host mentorship sessions and submit guidance feedback" },
    { code: "sponsor.metrics.view", name: "View Sponsor Metrics", category: "COMMUNICATION", description: "Access sponsored track submissions and engagement metrics" },
    { code: "announcement.send", name: "Broadcast Announcements", category: "COMMUNICATION", description: "Send announcements to participants, judges, or all attendees" },
    { code: "prize.manage", name: "Manage Prizes & Finance", category: "FINANCE", description: "Configure prize tiers, payouts, and sponsor awards" },
    { code: "audit.view", name: "View Audit Logs", category: "AUDIT", description: "Access historical activity logs, security trails, and compliance reports" },
  ];

  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, category: perm.category, description: perm.description },
      create: perm,
    });
  }

  const DEFAULT_ROLES = [
    { code: "SUPER_ADMIN", scope: "PLATFORM" },
    { code: "SUPPORT_ADMIN", scope: "PLATFORM" },
    { code: "ORGANIZER", scope: "EVENT" },
    { code: "CO_ORGANIZER", scope: "EVENT" },
    { code: "REGISTRATION_MANAGER", scope: "EVENT" },
    { code: "EVENT_OPS", scope: "EVENT" },
    { code: "JUDGE", scope: "EVENT" },
    { code: "HEAD_JUDGE", scope: "EVENT" },
    { code: "SUBMISSION_REVIEWER", scope: "EVENT" },
    { code: "MENTOR", scope: "EVENT" },
    { code: "VOLUNTEER", scope: "EVENT" },
    { code: "SPONSOR_REP", scope: "EVENT" },
    { code: "PRIZE_MANAGER", scope: "EVENT" },
    { code: "COMMUNICATIONS_MANAGER", scope: "EVENT" },
    { code: "AUDITOR", scope: "EVENT" },
  ];

  for (const r of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { scope: r.scope },
      create: {
        code: r.code,
        name: r.code.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        scope: r.scope,
      },
    });
  }

  console.log("Seeding completed successfully!");
}

seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
