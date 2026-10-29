import { describe, it, expect } from "vitest";
import { PrismaClient, CertificateType, HackathonStatus, RegistrationStatus } from "@prisma/client";
import { CertificateService } from "@/server/modules/certificate/certificate.service";

const prisma = new PrismaClient();

describe("Henry Hacker Techfest 2026 Winner Setup", () => {
  it("should make Henry Hacker win Techfest 2026 and issue his certificate", async () => {
    const hackathonId = "cmvtf2eg7000qabrg4zfflpgk"; // Techfest 2026
    const submissionId = "cmvtf2ey9001cabrgjcow5l9g"; // Nexora Agent Studio

    // 1. Ensure Prize exists
    let prize = await prisma.prize.findFirst({
      where: { hackathonId, rank: 1 },
    });
    if (!prize) {
      prize = await prisma.prize.create({
        data: {
          hackathonId,
          title: "1st Place - Grand Champion",
          rank: 1,
          amount: 100000,
          currency: "USD",
          description: "Awarded to the most outstanding technical implementation.",
        },
      });
      console.log("Created 1st Place Prize:", prize.id);
    }

    // 2. Award prize to Henry Hacker submission
    const existingAward = await prisma.prizeAward.findUnique({
      where: { prizeId_submissionId: { prizeId: prize.id, submissionId } },
    });
    if (!existingAward) {
      await prisma.prizeAward.create({
        data: {
          prizeId: prize.id,
          submissionId,
        },
      });
      console.log("Awarded 1st place to submission:", submissionId);
    }

    // 3. Lock judging and publish results on Techfest 2026
    await prisma.hackathon.update({
      where: { id: hackathonId },
      data: {
        judgingLockedAt: new Date(),
        resultsPublishedAt: new Date(),
        status: HackathonStatus.RESULTS_PUBLISHED,
      },
    });
    console.log("Techfest 2026 results published!");

    // 4. Issue certificates for Techfest 2026
    const superAdmin = {
      id: "system",
      email: "system@nexora.app",
      platformRole: "SUPER_ADMIN" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    const res = await CertificateService.issueBulk(superAdmin, hackathonId, {
      types: [CertificateType.PARTICIPATION, CertificateType.WINNER],
    });
    console.log("Bulk certificate issue result:", res);
    expect(res.success).toBe(true);

    // 5. Query Henry's certificates
    const henryCerts = await prisma.certificate.findMany({
      where: { userId: "cmvtf2e5u000eabrgyscf22eg" },
    });
    console.log("Henry Hacker certificates count:", henryCerts.length);
    for (const c of henryCerts) {
      console.log(`- Type: ${c.type}, ID: ${c.certificateId}, Code: ${c.verificationCode}, Status: ${c.status}`);
    }
    expect(henryCerts.length).toBeGreaterThan(0);
    const winnerCert = henryCerts.find((c) => c.type === CertificateType.WINNER);
    expect(winnerCert).toBeDefined();
    expect(winnerCert?.status).toBe("ISSUED");

    // Test Henry downloading his own Winner certificate
    const henryAuth = {
      id: "cmvtf2e5u000eabrgyscf22eg",
      email: "hacker@nexora.app",
      platformRole: "USER" as const,
      emailVerified: true,
      status: "ACTIVE" as const,
    };

    const download = await CertificateService.downloadCertificate(henryAuth, winnerCert!.id);
    expect(download.pdfBuffer).toBeInstanceOf(Buffer);
    expect(download.pdfBuffer.length).toBeGreaterThan(10000);
    expect(download.filename).toContain("NEX-2026");
    expect(download.filename).toContain("Henry_Hacker");
    console.log("Successfully verified download for Henry:", download.filename);
  });
});

