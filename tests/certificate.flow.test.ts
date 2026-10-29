import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, CertificateType, CertificateStatus, RegistrationStatus, HackathonStatus } from "@prisma/client";
import { CertificateService } from "@/server/modules/certificate/certificate.service";

const prisma = new PrismaClient();

describe("Participant Certificate Flow & Security Suite", () => {
  let orgA: any;
  let orgB: any;
  let adminOrgA: any;
  let adminOrgB: any;
  let studentA: any;
  let studentB: any;
  let absentStudent: any;
  let unapprovedStudent: any;
  let hackathon: any;
  let winnerPrize: any;
  let winnerSubmission: any;

  beforeAll(async () => {
    // 1. Create Organization A (Host College) and Organization B (Other College)
    orgA = await prisma.organization.create({
      data: {
        name: "Test Institute of Technology A",
        slug: `test-org-a-${Date.now()}`,
      },
    });

    orgB = await prisma.organization.create({
      data: {
        name: "Rival College B",
        slug: `test-org-b-${Date.now()}`,
      },
    });

    // 2. Create Users
    adminOrgA = await prisma.user.create({
      data: {
        email: `admin-a-${Date.now()}@test.com`,
        name: "Admin Org A",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });

    adminOrgB = await prisma.user.create({
      data: {
        email: `admin-b-${Date.now()}@test.com`,
        name: "Admin Org B",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });

    studentA = await prisma.user.create({
      data: {
        email: `student-a-${Date.now()}@test.com`,
        name: "Alice Active",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });

    studentB = await prisma.user.create({
      data: {
        email: `student-b-${Date.now()}@test.com`,
        name: "Bob Bystander",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });

    absentStudent = await prisma.user.create({
      data: {
        email: `absent-${Date.now()}@test.com`,
        name: "Arthur Absent",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });

    unapprovedStudent = await prisma.user.create({
      data: {
        email: `unapproved-${Date.now()}@test.com`,
        name: "Ursula Unapproved",
        platformRole: "USER",
        status: "ACTIVE",
      },
    });

    // 3. Assign Org Memberships
    await prisma.organizationMember.create({
      data: {
        organizationId: orgA.id,
        userId: adminOrgA.id,
        role: "ADMIN",
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: orgB.id,
        userId: adminOrgB.id,
        role: "ADMIN",
      },
    });

    // 4. Create Hackathon under Org A
    hackathon = await prisma.hackathon.create({
      data: {
        organizationId: orgA.id,
        createdById: adminOrgA.id,
        title: "Alpha Hackathon 2026",
        slug: `alpha-hack-${Date.now()}`,
        mode: "HYBRID",
        city: "Bangalore",
        country: "India",
        status: HackathonStatus.RESULTS_PUBLISHED,
        startsAt: new Date("2026-10-01"),
        endsAt: new Date("2026-10-03"),
        resultsPublishedAt: new Date(),
        judgingLockedAt: new Date(),
      },
    });

    // 5. Registrations
    // studentA: APPROVED and checked in
    const regA = await prisma.registration.create({
      data: {
        hackathonId: hackathon.id,
        userId: studentA.id,
        status: RegistrationStatus.APPROVED,
        qrToken: `QR-A-${Date.now()}`,
        checkedInAt: new Date(),
      },
    });

    // studentB: APPROVED and checked in
    await prisma.registration.create({
      data: {
        hackathonId: hackathon.id,
        userId: studentB.id,
        status: RegistrationStatus.APPROVED,
        qrToken: `QR-B-${Date.now()}`,
        checkedInAt: new Date(),
      },
    });

    // absentStudent: APPROVED but NOT checked in
    await prisma.registration.create({
      data: {
        hackathonId: hackathon.id,
        userId: absentStudent.id,
        status: RegistrationStatus.APPROVED,
        qrToken: `QR-ABSENT-${Date.now()}`,
        checkedInAt: null,
      },
    });

    // unapprovedStudent: PENDING status even if checkedInAt might be set
    await prisma.registration.create({
      data: {
        hackathonId: hackathon.id,
        userId: unapprovedStudent.id,
        status: RegistrationStatus.PENDING,
        qrToken: `QR-UNAPPROVED-${Date.now()}`,
        checkedInAt: new Date(),
      },
    });

    // 6. Winner Setup for studentA
    winnerPrize = await prisma.prize.create({
      data: {
        hackathonId: hackathon.id,
        title: "1st Place Grand Winner",
        rank: 1,
      },
    });

    const team = await prisma.team.create({
      data: {
        hackathonId: hackathon.id,
        name: "Team Alpha",
        leaderId: studentA.id,
        inviteCode: `ALPHA-${Date.now()}`,
      },
    });

    await prisma.teamMember.create({
      data: {
        hackathonId: hackathon.id,
        teamId: team.id,
        registrationId: regA.id,
        role: "LEADER",
      },
    });

    winnerSubmission = await prisma.submission.create({
      data: {
        hackathonId: hackathon.id,
        teamId: team.id,
        anonymousCode: `SUB-${Date.now()}`,
        title: "Alpha Project",
        repoUrl: "https://github.com/alpha/project",
        status: "SUBMITTED",
      },
    });

    await prisma.prizeAward.create({
      data: {
        prizeId: winnerPrize.id,
        submissionId: winnerSubmission.id,
      },
    });
  });

  afterAll(async () => {
    if (hackathon) {
      await prisma.hackathon.delete({ where: { id: hackathon.id } }).catch(() => {});
    }
    if (orgA) {
      await prisma.organization.delete({ where: { id: orgA.id } }).catch(() => {});
    }
    if (orgB) {
      await prisma.organization.delete({ where: { id: orgB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("should issue certificates only for approved attendees and award winners", async () => {
    const adminUser = {
      id: adminOrgA.id,
      email: adminOrgA.email,
      platformRole: "USER" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    const res = await CertificateService.issueBulk(adminUser, hackathon.id, {
      types: [CertificateType.PARTICIPATION, CertificateType.WINNER],
    });

    expect(res.success).toBe(true);

    // Verify studentA received PARTICIPATION and WINNER
    const studentACerts = await prisma.certificate.findMany({
      where: { hackathonId: hackathon.id, userId: studentA.id },
    });
    expect(studentACerts.length).toBe(2);
    expect(studentACerts.some((c) => c.type === CertificateType.PARTICIPATION)).toBe(true);
    expect(studentACerts.some((c) => c.type === CertificateType.WINNER)).toBe(true);

    // Verify studentB received only PARTICIPATION
    const studentBCerts = await prisma.certificate.findMany({
      where: { hackathonId: hackathon.id, userId: studentB.id },
    });
    expect(studentBCerts.length).toBe(1);
    expect(studentBCerts[0].type).toBe(CertificateType.PARTICIPATION);

    // Verify absentStudent received NO certificates
    const absentCerts = await prisma.certificate.findMany({
      where: { hackathonId: hackathon.id, userId: absentStudent.id },
    });
    expect(absentCerts.length).toBe(0);

    // Verify unapprovedStudent received NO certificates
    const unapprovedCerts = await prisma.certificate.findMany({
      where: { hackathonId: hackathon.id, userId: unapprovedStudent.id },
    });
    expect(unapprovedCerts.length).toBe(0);
  });

  it("should be idempotent: running issueBulk twice creates no duplicates", async () => {
    const adminUser = {
      id: adminOrgA.id,
      email: adminOrgA.email,
      platformRole: "USER" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    const countBefore = await prisma.certificate.count({
      where: { hackathonId: hackathon.id },
    });

    const res = await CertificateService.issueBulk(adminUser, hackathon.id, {
      types: [CertificateType.PARTICIPATION, CertificateType.WINNER],
    });

    expect(res.count).toBe(0);

    const countAfter = await prisma.certificate.count({
      where: { hackathonId: hackathon.id },
    });

    expect(countAfter).toBe(countBefore);
  });

  it("should enforce download authorization: student cannot download another student's certificate", async () => {
    const studentBCert = await prisma.certificate.findFirst({
      where: { hackathonId: hackathon.id, userId: studentB.id },
    });
    expect(studentBCert).toBeDefined();

    // Student A tries to download Student B's certificate
    const userA = {
      id: studentA.id,
      email: studentA.email,
      platformRole: "USER" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    await expect(
      CertificateService.downloadCertificate(userA, studentBCert!.id)
    ).rejects.toThrow("Permission denied.");
  });

  it("should enforce college boundaries: admin of another college gets 403", async () => {
    const studentACert = await prisma.certificate.findFirst({
      where: { hackathonId: hackathon.id, userId: studentA.id },
    });
    expect(studentACert).toBeDefined();

    // Admin of Org B tries to download Org A's certificate
    const userAdminB = {
      id: adminOrgB.id,
      email: adminOrgB.email,
      platformRole: "USER" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    await expect(
      CertificateService.downloadCertificate(userAdminB, studentACert!.id)
    ).rejects.toThrow("Permission denied.");

    // Admin of Org B tries to download ZIP of Org A
    await expect(
      CertificateService.downloadAllZip(userAdminB, hackathon.id)
    ).rejects.toThrow("Permission denied.");

    // Admin of Org B tries to revoke a certificate of Org A
    await expect(
      CertificateService.revoke(userAdminB, hackathon.id, studentACert!.id)
    ).rejects.toThrow("Permission denied.");
  });

  it("should allow a student to download their own certificate PDF", async () => {
    const studentACert = await prisma.certificate.findFirst({
      where: { hackathonId: hackathon.id, userId: studentA.id },
    });

    const userA = {
      id: studentA.id,
      email: studentA.email,
      platformRole: "USER" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    const download = await CertificateService.downloadCertificate(userA, studentACert!.id);
    expect(download.pdfBuffer).toBeInstanceOf(Buffer);
    expect(download.pdfBuffer.length).toBeGreaterThan(10000);
    expect(download.filename).toContain(".pdf");
  });

  it("should allow hackathon organizer to download ZIP of all certificates", async () => {
    const adminUser = {
      id: adminOrgA.id,
      email: adminOrgA.email,
      platformRole: "USER" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    const zip = await CertificateService.downloadAllZip(adminUser, hackathon.id);
    expect(zip.zipBuffer).toBeInstanceOf(Buffer);
    expect(zip.zipBuffer.length).toBeGreaterThan(500);
    expect(zip.filename).toContain("-certificates.zip");
  });

  it("should support revocation and reflect correctly on verify endpoint", async () => {
    const adminUser = {
      id: adminOrgA.id,
      email: adminOrgA.email,
      platformRole: "USER" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    const studentBCert = await prisma.certificate.findFirst({
      where: { hackathonId: hackathon.id, userId: studentB.id },
    });
    expect(studentBCert).toBeDefined();

    // 1. Verify it was VALID before revocation
    const verifyBefore = await CertificateService.verify(studentBCert!.verificationCode);
    expect(verifyBefore.valid).toBe(true);
    expect(verifyBefore.status).toBe("VALID");
    expect(verifyBefore.holder).toBe("Bob Bystander");
    expect(verifyBefore.college).toBe("Test Institute of Technology A");
    // Ensure no PII like email is returned
    expect((verifyBefore as any).email).toBeUndefined();

    // 2. Revoke certificate
    const revokeRes = await CertificateService.revoke(
      adminUser,
      hackathon.id,
      studentBCert!.id,
      "Violated code of conduct"
    );
    expect(revokeRes.status).toBe("REVOKED");

    // 3. Verify it is now REVOKED on verify endpoint
    const verifyAfter = await CertificateService.verify(studentBCert!.verificationCode);
    expect(verifyAfter.valid).toBe(false);
    expect(verifyAfter.status).toBe("REVOKED");
    expect(verifyAfter.holder).toBe("Bob Bystander");
    expect((verifyAfter as any).revocationReason).toBe("Violated code of conduct");
    expect((verifyAfter as any).email).toBeUndefined();

    // 4. Verify non-existent code returns NOT_FOUND
    const verifyNotFound = await CertificateService.verify("NON-EXISTENT-CODE-12345");
    expect(verifyNotFound.valid).toBe(false);
    expect(verifyNotFound.status).toBe("NOT_FOUND");
  });
});
