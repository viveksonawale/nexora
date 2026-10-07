import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data...");

  // 1. Create a Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      platformRole: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  // 2. Create Organizations
  const org1 = await prisma.organization.upsert({
    where: { slug: 'iit-bombay' },
    update: {},
    create: {
      name: 'IIT Bombay',
      slug: 'iit-bombay',
      type: 'COLLEGE',
      status: 'ACTIVE',
    }
  });

  const org2 = await prisma.organization.upsert({
    where: { slug: 'iit-delhi' },
    update: {},
    create: {
      name: 'IIT Delhi',
      slug: 'iit-delhi',
      type: 'COLLEGE',
      status: 'ACTIVE',
    }
  });

  // 3. Create Hackathons
  // Live Hackathon
  await prisma.hackathon.upsert({
    where: { slug: 'techfest-2026' },
    update: {},
    create: {
      title: 'Techfest 2026',
      slug: 'techfest-2026',
      tagline: 'Asia’s Largest Science and Technology Festival',
      description: 'Join thousands of developers to build the future.',
      mode: 'OFFLINE',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      city: 'Mumbai',
      organizationId: org1.id,
      createdById: admin.id,
      registrationOpensAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      registrationClosesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // Started 1 day ago
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // Ends in 2 days
      submissionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    }
  });

  // Upcoming Hackathon
  await prisma.hackathon.upsert({
    where: { slug: 'tryst-2026' },
    update: {},
    create: {
      title: 'Tryst 2026',
      slug: 'tryst-2026',
      tagline: 'Annual Technical Festival of IIT Delhi',
      description: 'Unleash your coding skills in this 48-hour hackathon.',
      mode: 'HYBRID',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      city: 'New Delhi',
      organizationId: org2.id,
      createdById: admin.id,
      registrationOpensAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // Opens tomorrow
      registrationClosesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15), 
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20), // Starts in 20 days
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 22),
      submissionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 22),
    }
  });

  console.log("Seeding complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
