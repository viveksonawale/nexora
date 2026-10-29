require("dotenv").config();
const {
  PrismaClient,
  PlatformRole,
  OrganizationType,
  OrganizationStatus,
  HackathonMode,
  HackathonStatus,
  RegistrationStatus,
  SubmissionStatus,
} = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("=== Scaling Detailed Live Data in Supabase Mumbai ===");

  // 1. Ensure we have 12 total organizations
  console.log("1. Checking and creating organizations to reach 12...");
  const extraOrgs = [
    { name: "MIT Hacking Medicine", slug: "mit-hacking-medicine", type: OrganizationType.COMMUNITY, description: "Accelerating healthcare innovation through multidisciplinary hackathons." },
    { name: "Berkeley AI Research", slug: "berkeley-ai-research", type: OrganizationType.UNIVERSITY, description: "Advancing foundational AI, reinforcement learning, and autonomous agents." },
    { name: "Oxford Cyber Institute", slug: "oxford-cyber-institute", type: OrganizationType.UNIVERSITY, description: "Securing next-generation decentralized and cloud infrastructure." },
    { name: "Cambridge Quantum Society", slug: "cambridge-quantum-society", type: OrganizationType.COMMUNITY, description: "Pioneering quantum algorithms and photonic quantum computation." },
  ];

  for (const org of extraOrgs) {
    await prisma.organization.upsert({
      where: { slug: org.slug },
      update: { status: OrganizationStatus.ACTIVE },
      create: {
        name: org.name,
        slug: org.slug,
        type: org.type,
        status: OrganizationStatus.ACTIVE,
        description: org.description,
      },
    });
  }

  const allOrgs = await prisma.organization.findMany();
  console.log(`Total organizations now in Supabase: ${allOrgs.length}`);

  // 2. Fetch the target hackathons
  const nexora = await prisma.hackathon.findUnique({ where: { slug: "nexora-2026" } });
  const iitd = await prisma.hackathon.findUnique({ where: { slug: "iit-delhi-hackathon" } });
  const iitb = await prisma.hackathon.findUnique({ where: { slug: "iit-bombay-hackathon" } });
  const campus = await prisma.hackathon.findUnique({ where: { slug: "campus-innovate" } });

  if (!nexora || !iitd || !iitb || !campus) {
    throw new Error("One or more target hackathons not found. Run seed_rich_data.js first.");
  }

  // 3. Update hackathons to have the exact deadlines matching the design screenshot
  // Screenshot deadlines:
  // - Nexora 2026: Registration Deadline Oct 12, Results Oct 28
  // - IIT Delhi: Submission Deadline Oct 15
  // - IIT Bombay: Judging Phase Oct 20
  console.log("2. Aligning hackathon milestones with dashboard deadlines...");
  const refDate = new Date("2026-10-09T00:00:00Z");

  await prisma.hackathon.update({
    where: { id: nexora.id },
    data: {
      registrationClosesAt: new Date("2026-10-12T23:59:59Z"),
      submissionDeadline: new Date("2026-10-24T23:59:59Z"),
      resultsPublishedAt: new Date("2026-10-28T18:00:00Z"),
    },
  });

  await prisma.hackathon.update({
    where: { id: iitd.id },
    data: {
      registrationClosesAt: new Date("2026-10-11T23:59:59Z"),
      submissionDeadline: new Date("2026-10-15T23:59:59Z"),
      judgingStartsAt: new Date("2026-10-16T09:00:00Z"),
    },
  });

  await prisma.hackathon.update({
    where: { id: iitb.id },
    data: {
      registrationClosesAt: new Date("2026-10-14T23:59:59Z"),
      submissionDeadline: new Date("2026-10-19T23:59:59Z"),
      judgingStartsAt: new Date("2026-10-20T10:00:00Z"),
    },
  });

  // 4. Batch generate realistic users so we can reach exactly 428 registrations
  console.log("3. Checking existing users and generating required participants...");
  const currentRegCount = await prisma.registration.count();
  console.log(`Current registrations count: ${currentRegCount}`);

  // Targets:
  // Nexora 2026: 182
  // IIT Delhi: 96
  // IIT Bombay: 78
  // Campus Innovate: 72
  // Total: 428
  const targets = [
    { hackathon: nexora, target: 182, teamsTarget: 42, subsTarget: 28 },
    { hackathon: iitd, target: 96, teamsTarget: 18, subsTarget: 12 },
    { hackathon: iitb, target: 78, teamsTarget: 16, subsTarget: 16 },
    { hackathon: campus, target: 72, teamsTarget: 10, subsTarget: 8 },
  ];

  // First, create 430 participant users if not already present
  const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  const firstNames = ["Aarav", "Priya", "Rohan", "Sneha", "Aditya", "Ananya", "Vikram", "Neha", "Rishabh", "Tanvi", "Arjun", "Kavita", "Alex", "Dev", "Isha", "Kunal", "Meera", "Nikhil", "Pooja", "Rahul", "Siddharth", "Tara", "Varun", "Zoya", "Liam", "Emma", "Noah", "Olivia", "James", "Sophia"];
  const lastNames = ["Sharma", "Patel", "Gupta", "Rao", "Verma", "Iyer", "Malhotra", "Nair", "Mehta", "Deshmukh", "Reddy", "Sen", "Chen", "Joshi", "Kapoor", "Bhatia", "Chopra", "Kulkarni", "Saxena", "Choudhury", "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis"];

  const usersToCreate = [];
  for (let i = 1; i <= 430; i++) {
    const email = `hacker_${i}@community.nexora.app`;
    if (!existingEmails.has(email)) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      usersToCreate.push({
        name: `${fn} ${ln}`,
        email,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhashforseedonly",
        platformRole: PlatformRole.USER,
        status: "ACTIVE",
        emailVerifiedAt: new Date("2026-10-01T00:00:00Z"),
      });
    }
  }

  if (usersToCreate.length > 0) {
    console.log(`Inserting ${usersToCreate.length} participant users...`);
    await prisma.user.createMany({
      data: usersToCreate,
      skipDuplicates: true,
    });
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    where: { email: { contains: "nexora.app" } },
  });
  console.log(`Total available participant pool: ${allUsers.length}`);

  // 5. Seed Registrations per Hackathon to hit exact target numbers
  console.log("4. Seeding registrations with realistic October timeline dates...");
  let userIndex = 0;

  for (const { hackathon, target } of targets) {
    const existing = await prisma.registration.count({ where: { hackathonId: hackathon.id } });
    const needed = target - existing;
    console.log(`Hackathon [${hackathon.title}]: current=${existing}, target=${target}, needed=${needed}`);

    if (needed > 0) {
      const regData = [];
      for (let i = 0; i < needed; i++) {
        const u = allUsers[(userIndex++) % allUsers.length];

        // Distribute createdAt between Oct 1 and Oct 29, 2026
        // Curve: lower in early Oct, rising towards late Oct
        const dayOffset = Math.floor(Math.pow(Math.random(), 0.7) * 28) + 1; // 1 to 29
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const regDate = new Date(`2026-10-${String(dayOffset).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);

        regData.push({
          hackathonId: hackathon.id,
          userId: u.id,
          status: RegistrationStatus.APPROVED,
          qrToken: `QR-${hackathon.slug.slice(0, 4).toUpperCase()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
          checkedInAt: dayOffset < 26 ? regDate : null,
          createdAt: regDate,
        });
      }

      await prisma.registration.createMany({
        data: regData,
        skipDuplicates: true,
      });
    }
  }

  // 6. Seed Teams & Submissions
  console.log("5. Seeding teams and submissions...");
  const teamThemes = [
    "Nova Agents", "Neural Mesh", "SolFlow", "Quantum Pulse", "HyperSync", "CyberShield",
    "OmniVision", "EchoData", "DeepRoute", "BioMatrix", "TensorGrid", "Aegis AI",
    "Prism Logic", "Vortex Protocol", "ZeroGuard", "Aura Health", "Nexus Edge", "CarbonTrace",
    "Sentient Core", "Orbital Code", "Flux Engine", "Helios Energy", "IronClad Security", "Synapse Net",
    "Cognitive Layer", "Veritas ZK", "StrataDB", "Apex Runners", "Krypton Web", "Titan Forge"
  ];

  for (const { hackathon, teamsTarget, subsTarget } of targets) {
    const existingTeams = await prisma.team.count({ where: { hackathonId: hackathon.id } });
    const neededTeams = teamsTarget - existingTeams;
    console.log(`Teams for [${hackathon.title}]: current=${existingTeams}, needed=${neededTeams}`);

    for (let i = 0; i < neededTeams; i++) {
      const theme = teamThemes[(existingTeams + i) % teamThemes.length];
      const teamName = `${theme} ${existingTeams + i + 1}`;
      const leader = allUsers[(userIndex++) % allUsers.length];

      try {
        const team = await prisma.team.create({
          data: {
            hackathonId: hackathon.id,
            leaderId: leader.id,
            name: teamName,
            inviteCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
            description: `Building decentralized intelligence and next-gen tools for ${hackathon.title}.`,
          },
        });

        // Add leader as team member
        const reg = await prisma.registration.findUnique({
          where: { hackathonId_userId: { hackathonId: hackathon.id, userId: leader.id } },
        });

        if (reg) {
          await prisma.teamMember.create({
            data: {
              hackathonId: hackathon.id,
              teamId: team.id,
              userId: leader.id,
              registrationId: reg.id,
              role: "LEADER",
            },
          }).catch(() => {});
        }
      } catch (err) {
        // Skip duplicate names
      }
    }

    // Submissions
    const existingSubs = await prisma.submission.count({ where: { hackathonId: hackathon.id } });
    const neededSubs = subsTarget - existingSubs;
    console.log(`Submissions for [${hackathon.title}]: current=${existingSubs}, needed=${neededSubs}`);

    const teamsWithoutSubs = await prisma.team.findMany({
      where: { hackathonId: hackathon.id, submission: null },
      take: Math.max(0, neededSubs),
    });

    for (let i = 0; i < teamsWithoutSubs.length; i++) {
      const team = teamsWithoutSubs[i];
      try {
        await prisma.submission.create({
          data: {
            hackathonId: hackathon.id,
            teamId: team.id,
            anonymousCode: `SUB-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
            title: `${team.name} Solution`,
            tagline: "Autonomous end-to-end framework built during Nexora sprints",
            description: "High-throughput system built with Rust, Next.js, and autonomous agent loops.",
            repoUrl: `https://github.com/nexora-hacks/${team.name.toLowerCase().replace(/\\s+/g, "-")}`,
            demoUrl: `https://${team.name.toLowerCase().replace(/\\s+/g, "")}.vercel.app`,
            techStack: ["Next.js", "TypeScript", "Python", "Rust", "Tailwind CSS"],
            status: SubmissionStatus.SUBMITTED,
            submittedAt: new Date(),
          },
        });
      } catch (e) {
        // Skip duplicate
      }
    }
  }

  // 7. Verify final counts
  const finalHackathons = await prisma.hackathon.count();
  const finalOrgs = await prisma.organization.count();
  const finalRegs = await prisma.registration.count();
  const finalTeams = await prisma.team.count();
  const finalSubs = await prisma.submission.count();

  console.log("\n==========================================");
  console.log("FINAL LIVE SUPABASE MUMBAI METRICS:");
  console.log(`- Total Hackathons:     ${finalHackathons}`);
  console.log(`- Total Organizations:  ${finalOrgs}`);
  console.log(`- Total Registrations:  ${finalRegs}`);
  console.log(`- Total Teams:          ${finalTeams}`);
  console.log(`- Total Submissions:    ${finalSubs}`);
  console.log("==========================================\n");
}

main()
  .catch((e) => {
    console.error("Scale seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

