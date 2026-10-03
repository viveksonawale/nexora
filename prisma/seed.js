const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");

async function main() {
  console.log("Seeding database...");

  // 1. Clean up
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  
  // 2. Create Platform Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@nexora.com",
      name: "Nexora Admin",
      role: "ADMIN",
    },
  });

  // 3. Create Organizer
  const organizer = await prisma.user.create({
    data: {
      email: "organizer@hackathon.com",
      name: "Alice Organizer",
      role: "USER",
      profile: {
        create: {
          bio: "I organize hackathons.",
        },
      },
    },
  });

  // 4. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Global Hackers",
      slug: "global-hackers",
      status: "APPROVED",
      members: {
        create: {
          userId: organizer.id,
          role: "OWNER",
        },
      },
    },
  });

  // 5. Create Hackathon
  const now = new Date();
  const hackathon = await prisma.hackathon.create({
    data: {
      organizationId: org.id,
      title: "Global Hackathon 2026",
      slug: "global-hackathon-2026",
      tagline: "Build the future.",
      description: "A worldwide online hackathon.",
      mode: "ONLINE",
      startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
      endsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      timezone: "UTC",
      maxTeamSize: 4,
      status: "PUBLISHED",
      
      // Setup some tracks
      tracks: {
        create: [
          { name: "AI/ML", description: "Build intelligent apps" },
          { name: "Web3", description: "Decentralized applications" },
        ],
      },
      // Setup some criteria
      judgingCriteria: {
        create: [
          { name: "Innovation", maxScore: 10, weight: 1.5 },
          { name: "Execution", maxScore: 10, weight: 1.0 },
        ],
      },
    },
  });

  // 6. Create Participant
  const participant = await prisma.user.create({
    data: {
      email: "hacker@example.com",
      name: "Bob Hacker",
      role: "USER",
    },
  });

  // 7. Register Participant
  const qrToken = "QR-" + crypto.randomBytes(8).toString("hex").toUpperCase();
  await prisma.registration.create({
    data: {
      hackathonId: hackathon.id,
      userId: participant.id,
      status: "APPROVED",
      qrToken,
    },
  });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
