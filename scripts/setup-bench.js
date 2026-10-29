const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = "TestPass123!";
  const passwordHash = await argon2.hash(defaultPassword);

  // 1. Ensure Organizer exists
  let organizer = await prisma.user.findUnique({ where: { email: "organizer@nexora.app" } });
  if (!organizer) {
    organizer = await prisma.user.create({
      data: {
        email: "organizer@nexora.app",
        name: "Olivia Organizer",
        passwordHash,
        emailVerifiedAt: new Date(),
        onboardingStatus: "VERIFIED",
      },
    });
  }

  // 2. Ensure Student exists
  let student = await prisma.user.findUnique({ where: { email: "student@nexora.app" } });
  if (!student) {
    student = await prisma.user.create({
      data: {
        email: "student@nexora.app",
        name: "Sam Student",
        passwordHash,
        emailVerifiedAt: new Date(),
        onboardingStatus: "VERIFIED",
      },
    });
  }

  // 3. Find or set a LIVE hackathon
  let hackathon = await prisma.hackathon.findFirst({
    where: { title: "Techfest 2026" },
  });

  if (!hackathon) {
    hackathon = await prisma.hackathon.findFirst();
  }

  if (hackathon) {
    await prisma.hackathon.update({
      where: { id: hackathon.id },
      data: { status: "LIVE", createdById: organizer.id },
    });
  }

  // 4. Ensure Student has APPROVED registration
  const existingReg = await prisma.registration.findUnique({
    where: { hackathonId_userId: { hackathonId: hackathon.id, userId: student.id } },
  });

  if (!existingReg) {
    await prisma.registration.create({
      data: {
        hackathonId: hackathon.id,
        userId: student.id,
        status: "APPROVED",
        qrToken: "test_qr_" + Date.now(),
      },
    });
  } else {
    await prisma.registration.update({
      where: { id: existingReg.id },
      data: { status: "APPROVED", checkedInAt: null, checkedInById: null },
    });
  }

  console.log("==================================================");
  console.log("🎯 TEST BENCH READY!");
  console.log("==================================================");
  console.log(`Event Title:      ${hackathon.title} (Status: LIVE)`);
  console.log(`Event ID:         ${hackathon.id}`);
  console.log("--------------------------------------------------");
  console.log("Organizer Account: organizer@nexora.app / TestPass123!");
  console.log(`Organizer URL:     http://localhost:3000/dashboard/hackathons/${hackathon.id}/check-in`);
  console.log("--------------------------------------------------");
  console.log("Student Account:   student@nexora.app / TestPass123!");
  console.log(`Student Scan URL:  http://localhost:3000/hackathons/${hackathon.id}/check-in`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

