require("dotenv").config();
const {
  PrismaClient,
  PlatformRole,
  OrganizationType,
  OrganizationStatus,
  OrgRole,
  HackathonStaffRole,
  StaffStatus,
  HackathonMode,
  HackathonStatus,
  Visibility,
  RegistrationStatus,
  TeamRole,
  SubmissionStatus,
  SponsorTier,
} = require("@prisma/client");
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

async function main() {
  console.log("Feeding detailed, realistic data to Supabase Mumbai...");

  const defaultPassword = "TestPass123!";
  const passwordHash = await hashPassword(defaultPassword);

  // ── 1. Create Core Platform Users ──
  console.log("Seeding platform users...");
  const usersData = [
    { name: "Nexora Super Admin", email: "admin@nexora.app", role: PlatformRole.SUPER_ADMIN, slug: "super-admin", headline: "Lead Platform Director", bio: "Managing the Nexora platform." },
    { name: "Olivia Organizer", email: "organizer@nexora.app", role: PlatformRole.USER, slug: "olivia-organizer", headline: "Hackathon Operations Lead", bio: "Directing developer championships worldwide." },
    { name: "Arthur Admin", email: "orgadmin@nexora.app", role: PlatformRole.USER, slug: "arthur-admin", headline: "Organization Co-Lead", bio: "Managing organizational logistics and judging." },
    { name: "Sarah Staff", email: "orgstaff@nexora.app", role: PlatformRole.USER, slug: "sarah-staff", headline: "Event Coordinator", bio: "Facilitating participants and teams." },
    { name: "Julian Judge", email: "judge@nexora.app", role: PlatformRole.USER, slug: "julian-judge", headline: "Senior Software Architect", bio: "Evaluating architecture and code quality." },
    { name: "Marcus Mentor", email: "mentor@nexora.app", role: PlatformRole.USER, slug: "marcus-mentor", headline: "AI & Cloud Solutions Architect", bio: "Guiding hacker teams to victory." },
    { name: "Valerie Volunteer", email: "volunteer@nexora.app", role: PlatformRole.USER, slug: "valerie-volunteer", headline: "Campus Operations Volunteer", bio: "Facilitating participant check-in." },
    { name: "Aarav Sharma", email: "aarav@nexora.app", role: PlatformRole.USER, slug: "aarav-sharma", headline: "Full-Stack ML Engineer @ IITD", bio: "Passionate about autonomous edge systems." },
    { name: "Priya Patel", email: "priya@nexora.app", role: PlatformRole.USER, slug: "priya-patel", headline: "Cloud Systems Architect", bio: "Distributed computing and Kubernetes enthusiast." },
    { name: "Rohan Gupta", email: "rohan@nexora.app", role: PlatformRole.USER, slug: "rohan-gupta", headline: "AI Research Fellow", bio: "Deep learning and natural language processing." },
    { name: "Sneha Rao", email: "sneha@nexora.app", role: PlatformRole.USER, slug: "sneha-rao", headline: "Smart Contract & Protocol Dev", bio: "Building zero-knowledge payment infrastructure." },
    { name: "Aditya Verma", email: "aditya@nexora.app", role: PlatformRole.USER, slug: "aditya-verma", headline: "High-Performance Rust Specialist", bio: "Compiler engineering and low-latency systems." },
    { name: "Ananya Iyer", email: "ananya@nexora.app", role: PlatformRole.USER, slug: "ananya-iyer", headline: "Product Designer & UI Engineer", bio: "Designing accessible and responsive interfaces." },
    { name: "Vikram Malhotra", email: "vikram@nexora.app", role: PlatformRole.USER, slug: "vikram-malhotra", headline: "Quantum Computing Researcher", bio: "Qiskit algorithms and lattice-based security." },
    { name: "Neha Nair", email: "neha@nexora.app", role: PlatformRole.USER, slug: "neha-nair", headline: "Cybersecurity Analyst", bio: "Penetration testing and cloud security posture." },
    { name: "Rishabh Mehta", email: "rishabh@iitd.ac.in", role: PlatformRole.USER, slug: "rishabh-mehta", headline: "Robotics Student @ IIT Delhi", bio: "Computer vision and autonomous path planning." },
    { name: "Tanvi Deshmukh", email: "tanvi@iitb.ac.in", role: PlatformRole.USER, slug: "tanvi-deshmukh", headline: "FinTech Specialist @ IIT Bombay", bio: "Algorithmic market making and quantitative models." },
    { name: "Arjun Reddy", email: "arjun@vit.ac.in", role: PlatformRole.USER, slug: "arjun-reddy", headline: "Mobile App Developer", bio: "Flutter and React Native developer." },
    { name: "Kavita Sen", email: "kavita@stanford.edu", role: PlatformRole.USER, slug: "kavita-sen", headline: "Bioengineering Graduate Student", bio: "Computational genomics and protein folding." },
    { name: "Alex Chen", email: "alex@nexuslabs.dev", role: PlatformRole.USER, slug: "alex-chen", headline: "Core Protocol Engineer", bio: "EVM optimizations and rollup architectures." },
  ];

  const createdUsers = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        platformRole: u.role,
        emailVerifiedAt: new Date(),
        status: "ACTIVE",
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        platformRole: u.role,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            slug: u.slug,
            headline: u.headline,
            bio: u.bio,
            onboardingCompleted: true,
          },
        },
      },
    });
    createdUsers[u.email] = user;
  }

  // ── 2. Create Realistic Organizations ──
  console.log("Seeding organizations...");
  const orgsData = [
    {
      name: "Nexora",
      slug: "nexora-org",
      type: OrganizationType.COMPANY,
      status: OrganizationStatus.ACTIVE,
      description: "Official global hackathon management and developer challenge organization.",
      city: "San Francisco",
      country: "USA",
      websiteUrl: "https://nexora.app",
    },
    {
      name: "IIT Delhi",
      slug: "iit-delhi",
      type: OrganizationType.COLLEGE,
      status: OrganizationStatus.ACTIVE,
      description: "Indian Institute of Technology Delhi - Computer Science & Engineering Society.",
      city: "New Delhi",
      country: "India",
      websiteUrl: "https://home.iitd.ac.in",
    },
    {
      name: "IIT Bombay",
      slug: "iit-bombay",
      type: OrganizationType.COLLEGE,
      status: OrganizationStatus.ACTIVE,
      description: "Indian Institute of Technology Bombay - Techfest and Innovation Cell.",
      city: "Mumbai",
      country: "India",
      websiteUrl: "https://www.iitb.ac.in",
    },
    {
      name: "Nexus Labs",
      slug: "nexus-labs",
      type: OrganizationType.COMMUNITY,
      status: OrganizationStatus.ACTIVE,
      description: "Premier global developer guild and decentralized innovation collective.",
      city: "Bengaluru",
      country: "India",
      websiteUrl: "https://nexuslabs.dev",
    },
    {
      name: "Tech Club VIT",
      slug: "tech-club-vit",
      type: OrganizationType.COMMUNITY,
      status: OrganizationStatus.ACTIVE,
      description: "Vellore Institute of Technology developer society fostering campus innovation.",
      city: "Vellore",
      country: "India",
      websiteUrl: "https://vit.ac.in",
    },
    {
      name: "Stanford ACM",
      slug: "stanford-acm",
      type: OrganizationType.COLLEGE,
      status: OrganizationStatus.ACTIVE,
      description: "Stanford University Association for Computing Machinery.",
      city: "Stanford",
      country: "USA",
      websiteUrl: "https://acm.stanford.edu",
    },
    {
      name: "Google Developer Student Clubs",
      slug: "gdsc-global",
      type: OrganizationType.COMMUNITY,
      status: OrganizationStatus.ACTIVE,
      description: "University-based community groups for students interested in Google developer technologies.",
      city: "Mountain View",
      country: "USA",
      websiteUrl: "https://developers.google.com/community/gdsc",
    },
    {
      name: "ETH Global Hub",
      slug: "eth-global-hub",
      type: OrganizationType.COMMUNITY,
      status: OrganizationStatus.PENDING,
      description: "Decentralized ecosystem driving global Web3 hackathons.",
      city: "Singapore",
      country: "Singapore",
      websiteUrl: "https://ethglobal.com",
    },
  ];

  const createdOrgs = {};
  for (const o of orgsData) {
    const org = await prisma.organization.upsert({
      where: { slug: o.slug },
      update: {
        name: o.name,
        type: o.type,
        status: o.status,
        description: o.description,
        city: o.city,
        country: o.country,
        websiteUrl: o.websiteUrl,
      },
      create: o,
    });
    createdOrgs[o.slug] = org;

    // Attach Organizer as Owner
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: createdUsers["organizer@nexora.app"].id } },
      update: { role: OrgRole.OWNER },
      create: { organizationId: org.id, userId: createdUsers["organizer@nexora.app"].id, role: OrgRole.OWNER },
    });
  }

  // ── 3. Create Realistic Hackathons ──
  console.log("Seeding hackathons...");
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const hackathonsData = [
    {
      slug: "nexora-2026",
      title: "Nexora 2026",
      orgSlug: "nexora-org",
      tagline: "Global Flagship Software & Autonomous AI Championship",
      description: "The official world championship hackathon empowering the next wave of tech innovators. Build cutting-edge autonomous agents, scalable cloud architectures, and breakthrough applications.",
      mode: HackathonMode.HYBRID,
      city: "San Francisco",
      country: "USA",
      status: HackathonStatus.PUBLISHED,
      startsAt: new Date(now.getTime() - 2 * day),
      endsAt: new Date(now.getTime() + 14 * day),
      registrationOpensAt: new Date(now.getTime() - 15 * day),
      registrationClosesAt: new Date(now.getTime() + 3 * day),
      submissionDeadline: new Date(now.getTime() + 10 * day),
      tags: ["AI", "Next.js", "Cloud", "Distributed Systems"],
      minTeamSize: 1,
      maxTeamSize: 4,
    },
    {
      slug: "iit-delhi-hackathon",
      title: "IIT Delhi Hackathon",
      orgSlug: "iit-delhi",
      tagline: "Autonomous Robotics & Edge Intelligence Sprint",
      description: "A premier engineering challenge exploring low-latency perception, autonomous systems, edge ML inference, and physical AI platforms.",
      mode: HackathonMode.ONLINE,
      city: "New Delhi",
      country: "India",
      status: HackathonStatus.PUBLISHED,
      startsAt: new Date(now.getTime() - 1 * day),
      endsAt: new Date(now.getTime() + 6 * day),
      registrationOpensAt: new Date(now.getTime() - 12 * day),
      registrationClosesAt: new Date(now.getTime() + 2 * day),
      submissionDeadline: new Date(now.getTime() + 6 * day),
      tags: ["Robotics", "Edge AI", "Computer Vision", "Rust"],
      minTeamSize: 1,
      maxTeamSize: 4,
    },
    {
      slug: "iit-bombay-hackathon",
      title: "IIT Bombay Hackathon",
      orgSlug: "iit-bombay",
      tagline: "Quantum Computing & High-Frequency Fintech",
      description: "Tackle high-frequency order book simulations, post-quantum cryptography, and algorithmic portfolio balancing in a high-stakes competitive environment.",
      mode: HackathonMode.OFFLINE,
      city: "Mumbai",
      country: "India",
      status: HackathonStatus.PUBLISHED,
      startsAt: new Date(now.getTime() + 1 * day),
      endsAt: new Date(now.getTime() + 11 * day),
      registrationOpensAt: new Date(now.getTime() - 8 * day),
      registrationClosesAt: new Date(now.getTime() + 4 * day),
      submissionDeadline: new Date(now.getTime() + 10 * day),
      tags: ["Fintech", "Quantum", "Algorithms", "Python"],
      minTeamSize: 2,
      maxTeamSize: 4,
    },
    {
      slug: "campus-innovate",
      title: "Campus Innovate",
      orgSlug: "nexora-org",
      tagline: "Inter-College Social Impact & Climate Tech Sprint",
      description: "Designed for universities and student innovators solving green energy logistics, carbon tracing, and municipal resource optimization.",
      mode: HackathonMode.ONLINE,
      city: "Bengaluru",
      country: "India",
      status: HackathonStatus.PUBLISHED,
      startsAt: new Date(now.getTime() + 5 * day),
      endsAt: new Date(now.getTime() + 19 * day),
      registrationOpensAt: new Date(now.getTime() - 5 * day),
      registrationClosesAt: new Date(now.getTime() + 8 * day),
      submissionDeadline: new Date(now.getTime() + 18 * day),
      tags: ["ClimateTech", "IoT", "Data Science", "Mobile"],
      minTeamSize: 1,
      maxTeamSize: 5,
    },
    {
      slug: "web3-bounties-global",
      title: "Web3 Bounties Global",
      orgSlug: "nexus-labs",
      tagline: "Zero-Knowledge Proofs & Scalable DeFi Protocols",
      description: "Explore circuit optimization, account abstraction, and privacy-preserving smart contract mechanisms with global bounties.",
      mode: HackathonMode.ONLINE,
      city: "Singapore",
      country: "Singapore",
      status: HackathonStatus.PUBLISHED,
      startsAt: new Date(now.getTime() + 12 * day),
      endsAt: new Date(now.getTime() + 26 * day),
      registrationOpensAt: new Date(now.getTime() - 2 * day),
      registrationClosesAt: new Date(now.getTime() + 14 * day),
      submissionDeadline: new Date(now.getTime() + 25 * day),
      tags: ["Web3", "ZK-SNARKs", "Solidity", "Rust"],
      minTeamSize: 1,
      maxTeamSize: 4,
    },
    {
      slug: "cyberdefend-2026",
      title: "CyberDefend 2026",
      orgSlug: "stanford-acm",
      tagline: "Cloud Native Threat Simulation & Zero-Day Patching",
      description: "Test real-time incident response, reverse engineering, and automated defensive telemetry against enterprise honeypots.",
      mode: HackathonMode.HYBRID,
      city: "Stanford",
      country: "USA",
      status: HackathonStatus.DRAFT,
      startsAt: new Date(now.getTime() + 20 * day),
      endsAt: new Date(now.getTime() + 25 * day),
      registrationOpensAt: new Date(now.getTime() + 5 * day),
      registrationClosesAt: new Date(now.getTime() + 20 * day),
      submissionDeadline: new Date(now.getTime() + 24 * day),
      tags: ["Cybersecurity", "ZeroTrust", "Linux", "DevSecOps"],
      minTeamSize: 2,
      maxTeamSize: 4,
    },
  ];

  const createdHackathons = {};
  for (const h of hackathonsData) {
    const org = createdOrgs[h.orgSlug];
    const hackathon = await prisma.hackathon.upsert({
      where: { slug: h.slug },
      update: {
        title: h.title,
        tagline: h.tagline,
        description: h.description,
        mode: h.mode,
        city: h.city,
        country: h.country,
        status: h.status,
        startsAt: h.startsAt,
        endsAt: h.endsAt,
        registrationOpensAt: h.registrationOpensAt,
        registrationClosesAt: h.registrationClosesAt,
        submissionDeadline: h.submissionDeadline,
        tags: h.tags,
        minTeamSize: h.minTeamSize,
        maxTeamSize: h.maxTeamSize,
      },
      create: {
        organizationId: org.id,
        createdById: createdUsers["organizer@nexora.app"].id,
        slug: h.slug,
        title: h.title,
        tagline: h.tagline,
        description: h.description,
        mode: h.mode,
        city: h.city,
        country: h.country,
        status: h.status,
        visibility: Visibility.PUBLIC,
        startsAt: h.startsAt,
        endsAt: h.endsAt,
        registrationOpensAt: h.registrationOpensAt,
        registrationClosesAt: h.registrationClosesAt,
        submissionDeadline: h.submissionDeadline,
        tags: h.tags,
        minTeamSize: h.minTeamSize,
        maxTeamSize: h.maxTeamSize,
        blindJudging: true,
      },
    });
    createdHackathons[h.slug] = hackathon;

    // Attach Tracks
    await prisma.track.upsert({
      where: { hackathonId_name: { hackathonId: hackathon.id, name: "General AI & Core Software" } },
      update: {},
      create: {
        hackathonId: hackathon.id,
        name: "General AI & Core Software",
        description: "Autonomous agents, machine learning, and developer tooling.",
      },
    });

    // Attach Judging Criteria
    await prisma.judgingCriterion.upsert({
      where: { hackathonId_name: { hackathonId: hackathon.id, name: "Technical Execution" } },
      update: {},
      create: {
        hackathonId: hackathon.id,
        name: "Technical Execution",
        description: "Code quality, architecture, and engineering complexity.",
        maxScore: 10,
        weight: 1.5,
      },
    });
  }

  // ── 4. Create Registrations, Teams & Submissions ──
  console.log("Seeding teams, registrations and submissions...");
  const nexoraHack = createdHackathons["nexora-2026"];
  const iitdHack = createdHackathons["iit-delhi-hackathon"];
  const iitbHack = createdHackathons["iit-bombay-hackathon"];
  const campusHack = createdHackathons["campus-innovate"];

  // Helper for registration
  async function registerUser(hackathon, user) {
    return prisma.registration.upsert({
      where: { hackathonId_userId: { hackathonId: hackathon.id, userId: user.id } },
      update: { status: RegistrationStatus.APPROVED },
      create: {
        hackathonId: hackathon.id,
        userId: user.id,
        status: RegistrationStatus.APPROVED,
        qrToken: "QR-" + crypto.randomBytes(6).toString("hex").toUpperCase(),
        checkedInAt: new Date(),
      },
    });
  }

  // Register multiple participants in Nexora 2026
  const regAarav = await registerUser(nexoraHack, createdUsers["aarav@nexora.app"]);
  const regPriya = await registerUser(nexoraHack, createdUsers["priya@nexora.app"]);
  const regRohan = await registerUser(nexoraHack, createdUsers["rohan@nexora.app"]);
  const regSneha = await registerUser(nexoraHack, createdUsers["sneha@nexora.app"]);
  const regAditya = await registerUser(nexoraHack, createdUsers["aditya@nexora.app"]);
  const regAnanya = await registerUser(nexoraHack, createdUsers["ananya@nexora.app"]);
  const regVikram = await registerUser(iitbHack, createdUsers["vikram@nexora.app"]);
  const regTanvi = await registerUser(iitbHack, createdUsers["tanvi@iitb.ac.in"]);
  const regRishabh = await registerUser(iitdHack, createdUsers["rishabh@iitd.ac.in"]);
  const regNeha = await registerUser(iitdHack, createdUsers["neha@nexora.app"]);
  const regArjun = await registerUser(campusHack, createdUsers["arjun@vit.ac.in"]);
  const regKavita = await registerUser(campusHack, createdUsers["kavita@stanford.edu"]);

  // Team 1: Team Innovators (Nexora 2026)
  const teamInnovators = await prisma.team.upsert({
    where: { hackathonId_name: { hackathonId: nexoraHack.id, name: "Team Innovators" } },
    update: {},
    create: {
      hackathonId: nexoraHack.id,
      leaderId: createdUsers["aarav@nexora.app"].id,
      name: "Team Innovators",
      description: "Developing intelligent diagnostic telemetry and AI clinical triage.",
      inviteCode: "INNOVATE-2026",
    },
  });

  await prisma.teamMember.upsert({
    where: { registrationId_hackathonId: { registrationId: regAarav.id, hackathonId: nexoraHack.id } },
    update: {},
    create: { hackathonId: nexoraHack.id, teamId: teamInnovators.id, registrationId: regAarav.id, role: TeamRole.LEADER },
  });
  await prisma.teamMember.upsert({
    where: { registrationId_hackathonId: { registrationId: regPriya.id, hackathonId: nexoraHack.id } },
    update: {},
    create: { hackathonId: nexoraHack.id, teamId: teamInnovators.id, registrationId: regPriya.id, role: TeamRole.MEMBER },
  });

  // Team 2: NeuralNova (Nexora 2026)
  const teamNeuralNova = await prisma.team.upsert({
    where: { hackathonId_name: { hackathonId: nexoraHack.id, name: "NeuralNova" } },
    update: {},
    create: {
      hackathonId: nexoraHack.id,
      leaderId: createdUsers["sneha@nexora.app"].id,
      name: "NeuralNova",
      description: "Autonomous multi-agent orchestration framework for edge devices.",
      inviteCode: "NOVA-2026",
    },
  });

  await prisma.teamMember.upsert({
    where: { registrationId_hackathonId: { registrationId: regSneha.id, hackathonId: nexoraHack.id } },
    update: {},
    create: { hackathonId: nexoraHack.id, teamId: teamNeuralNova.id, registrationId: regSneha.id, role: TeamRole.LEADER },
  });

  // Team 3: EdgeRobotics (IIT Delhi)
  const teamEdgeRobotics = await prisma.team.upsert({
    where: { hackathonId_name: { hackathonId: iitdHack.id, name: "EdgeRobotics" } },
    update: {},
    create: {
      hackathonId: iitdHack.id,
      leaderId: createdUsers["rishabh@iitd.ac.in"].id,
      name: "EdgeRobotics",
      description: "Computer vision and path-planning for autonomous inspection drones.",
      inviteCode: "EDGE-IITD",
    },
  });

  await prisma.teamMember.upsert({
    where: { registrationId_hackathonId: { registrationId: regRishabh.id, hackathonId: iitdHack.id } },
    update: {},
    create: { hackathonId: iitdHack.id, teamId: teamEdgeRobotics.id, registrationId: regRishabh.id, role: TeamRole.LEADER },
  });

  // Team 4: QuantumShift (IIT Bombay)
  const teamQuantum = await prisma.team.upsert({
    where: { hackathonId_name: { hackathonId: iitbHack.id, name: "QuantumShift" } },
    update: {},
    create: {
      hackathonId: iitbHack.id,
      leaderId: createdUsers["tanvi@iitb.ac.in"].id,
      name: "QuantumShift",
      description: "Lattice-based post-quantum cryptography algorithms for real-time ledger settlement.",
      inviteCode: "QUANTUM-IITB",
    },
  });

  await prisma.teamMember.upsert({
    where: { registrationId_hackathonId: { registrationId: regTanvi.id, hackathonId: iitbHack.id } },
    update: {},
    create: { hackathonId: iitbHack.id, teamId: teamQuantum.id, registrationId: regTanvi.id, role: TeamRole.LEADER },
  });

  // Submissions
  await prisma.submission.upsert({
    where: { hackathonId_anonymousCode: { hackathonId: nexoraHack.id, anonymousCode: "SUB-NX1" } },
    update: {},
    create: {
      hackathonId: nexoraHack.id,
      teamId: teamInnovators.id,
      anonymousCode: "SUB-NX1",
      title: "AI Health Assistant",
      tagline: "Multimodal clinical triage and real-time medical diagnostic telemetry.",
      description: "Built with Rust, PyTorch, and Next.js, this assistant processes vital signs and radiology imaging at the edge to reduce hospital wait times.",
      repoUrl: "https://github.com/innovators/ai-health-assistant",
      demoUrl: "https://ai-health.nexora.app",
      techStack: ["Next.js", "PyTorch", "Rust", "PostgreSQL"],
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(now.getTime() - 45 * 60 * 1000), // 45m ago
    },
  });

  await prisma.submission.upsert({
    where: { hackathonId_anonymousCode: { hackathonId: iitdHack.id, anonymousCode: "SUB-IITD1" } },
    update: {},
    create: {
      hackathonId: iitdHack.id,
      teamId: teamEdgeRobotics.id,
      anonymousCode: "SUB-IITD1",
      title: "AeroSense Drone Telemetry",
      tagline: "Autonomous agricultural drone mapping and crop disease detection.",
      description: "A lightweight spatial intelligence pipeline running on embedded NVIDIA Jetson platforms with sub-50ms inference latency.",
      repoUrl: "https://github.com/edgerobotics/aerosense",
      demoUrl: "https://aerosense.iitd.ac.in",
      techStack: ["ROS2", "Python", "Jetson", "TensorRT"],
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(now.getTime() - 2 * day),
    },
  });

  // ── 5. Create Rich Audit Logs (Recent Activities) ──
  console.log("Seeding audit logs and live activity stream...");
  const auditLogs = [
    {
      action: "team.register",
      entityType: "Team",
      metadata: { title: "New team registered", detail: "Team Innovators - Nexora 2026", hackathon: "Nexora 2026" },
      createdAt: new Date(now.getTime() - 10 * 60 * 1000), // 10m ago
      actorId: createdUsers["aarav@nexora.app"].id,
    },
    {
      action: "submission.create",
      entityType: "Submission",
      metadata: { title: "Submission received", detail: "AI Health Assistant - IIT Delhi", hackathon: "IIT Delhi Hackathon" },
      createdAt: new Date(now.getTime() - 45 * 60 * 1000), // 45m ago
      actorId: createdUsers["priya@nexora.app"].id,
    },
    {
      action: "organization.create",
      entityType: "Organization",
      metadata: { title: "New organization onboarded", detail: "Tech Club VIT - by Admin" },
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h ago
      actorId: createdUsers["admin@nexora.app"].id,
    },
    {
      action: "hackathon.update",
      entityType: "Hackathon",
      metadata: { title: "Hackathon updated", detail: "IIT Bombay - Rules updated", hackathon: "IIT Bombay Hackathon" },
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4h ago
      actorId: createdUsers["organizer@nexora.app"].id,
    },
    {
      action: "user.register",
      entityType: "User",
      metadata: { title: "New user registered", detail: "rishabh@iitd.ac.in" },
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6h ago
      actorId: createdUsers["rishabh@iitd.ac.in"].id,
    },
    {
      action: "judging.assign",
      entityType: "JudgeAssignment",
      metadata: { title: "Judge assigned", detail: "Julian Judge assigned to AI Health Assistant" },
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8h ago
      actorId: createdUsers["organizer@nexora.app"].id,
    },
    {
      action: "organization.approve",
      entityType: "Organization",
      metadata: { title: "Organization approved", detail: "Stanford ACM approved by Super Admin" },
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12h ago
      actorId: createdUsers["admin@nexora.app"].id,
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: log,
    });
  }

  console.log("Rich realistic seed data successfully inserted into Supabase Mumbai!");
}

main()
  .catch((e) => {
    console.error("Error during rich seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

