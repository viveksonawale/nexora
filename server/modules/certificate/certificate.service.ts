import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { z } from "zod";
import { IssueCertificatesSchema } from "./certificate.schemas";
import { randomBytes } from "crypto";
import { CertificateType, CertificateStatus, RegistrationStatus } from "@prisma/client";
import { generateCertificatePdf } from "@/lib/certificates/pdf-generator";
import { CertificateStorageService } from "./certificate-storage.service";
import { ZipArchive } from "archiver";
import { env } from "@/server/lib/env";

export class CertificateService {
  public static async getHackathonAndVerifyAdmin(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      include: { organization: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    if (user.platformRole === "SUPER_ADMIN") {
      return hackathon;
    }

    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: hackathon.organizationId,
          userId: user.id,
        },
      },
    });

    const staffMember = await db.hackathonStaff.findFirst({
      where: {
        hackathonId,
        userId: user.id,
        role: { in: ["ORGANIZER", "CO_ORGANIZER"] },
        status: "ACTIVE",
      },
    });

    if (
      !can(user, "hackathon:update", {
        orgRole: membership?.role,
        staffRoles: staffMember ? [staffMember.role] : [],
      })
    ) {
      throw AppError.forbidden("Permission denied.");
    }
    return hackathon;
  }

  static async issueBulk(
    user: AuthUser,
    hackathonId: string,
    data: z.infer<typeof IssueCertificatesSchema>
  ) {
    const hackathon = await this.getHackathonAndVerifyAdmin(user, hackathonId);

    // Rule: Only after the hackathon results are published
    if (!hackathon.resultsPublishedAt) {
      throw AppError.businessRule(
        "INVALID_STATE",
        "Certificates can only be issued after hackathon results are published."
      );
    }

    const collegeName = hackathon.organization.name;
    const hackathonTitle = hackathon.title;
    const startDate = hackathon.startsAt;
    const endDate = hackathon.endsAt;
    const format = hackathon.mode;
    const location = hackathon.city
      ? hackathon.country
        ? `${hackathon.city}, ${hackathon.country}`
        : hackathon.city
      : hackathon.venueName || null;

    // Fetch up to 2 active organizers to serve as signatories
    const staffMembers = await db.hackathonStaff.findMany({
      where: {
        hackathonId,
        role: { in: ["ORGANIZER", "CO_ORGANIZER"] },
        status: "ACTIVE",
      },
      include: { user: true },
      take: 2,
    });

    const signatories =
      staffMembers.length > 0
        ? staffMembers.map((s) => ({
            name: s.user?.name || "Event Convener",
            role: "Hackathon Organizer",
            college: collegeName,
          }))
        : [
            {
              name: "Authorized Convener",
              role: "Head of Hackathons",
              college: collegeName,
            },
          ];

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";

    const candidatesToIssue: Array<{
      userId: string;
      recipientName: string;
      type: CertificateType;
      teamName?: string | null;
      position?: string | null;
    }> = [];

    // 1. PARTICIPATION Candidates
    if (data.types.includes(CertificateType.PARTICIPATION)) {
      const attendees = await db.registration.findMany({
        where: {
          hackathonId,
          status: RegistrationStatus.APPROVED,
          OR: [
            { checkedInAt: { not: null } },
            { attendanceRecords: { some: {} } },
          ],
        },
        include: {
          user: true,
          teamMember: { include: { team: true } },
        },
      });

      for (const att of attendees) {
        candidatesToIssue.push({
          userId: att.userId,
          recipientName: att.user.name || "Participant",
          type: CertificateType.PARTICIPATION,
          teamName: att.teamMember?.team.name || null,
          position: null,
        });
      }
    }

    // 2. WINNER Candidates
    if (data.types.includes(CertificateType.WINNER)) {
      const winningSubmissions = await db.submission.findMany({
        where: {
          hackathonId,
          awards: { some: {} },
        },
        include: {
          awards: { include: { prize: true } },
          team: {
            include: {
              members: {
                include: {
                  registration: {
                    include: {
                      user: true,
                      attendanceRecords: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const sub of winningSubmissions) {
        // Position name from the award
        const firstAward = sub.awards[0];
        const prizeTitle = firstAward?.prize?.title || "Winner";
        const position = prizeTitle.toLowerCase().includes("winner")
          ? prizeTitle
          : `${prizeTitle} Winner`;

        for (const member of sub.team.members) {
          const reg = member.registration;
          // Must be approved and checked in
          if (
            reg.status === RegistrationStatus.APPROVED &&
            (reg.checkedInAt !== null || reg.attendanceRecords.length > 0)
          ) {
            candidatesToIssue.push({
              userId: reg.userId,
              recipientName: reg.user.name || "Winner",
              type: CertificateType.WINNER,
              teamName: sub.team.name,
              position,
            });
          }
        }
      }
    }

    // 3. RUNNER_UP Candidates
    if (data.types.includes(CertificateType.RUNNER_UP)) {
      const runnerUpSubmissions = await db.submission.findMany({
        where: {
          hackathonId,
          awards: {
            some: {
              prize: {
                OR: [
                  { rank: 2 },
                  { title: { contains: "Runner", mode: "insensitive" } },
                  { title: { contains: "2nd", mode: "insensitive" } },
                ],
              },
            },
          },
        },
        include: {
          awards: { include: { prize: true } },
          team: {
            include: {
              members: {
                include: {
                  registration: {
                    include: {
                      user: true,
                      attendanceRecords: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const sub of runnerUpSubmissions) {
        const firstAward = sub.awards[0];
        const position = firstAward?.prize?.title || "Runner-up";

        for (const member of sub.team.members) {
          const reg = member.registration;
          if (
            reg.status === RegistrationStatus.APPROVED &&
            (reg.checkedInAt !== null || reg.attendanceRecords.length > 0)
          ) {
            candidatesToIssue.push({
              userId: reg.userId,
              recipientName: reg.user.name || "Runner-up",
              type: CertificateType.RUNNER_UP,
              teamName: sub.team.name,
              position,
            });
          }
        }
      }
    }

    let issuedCount = 0;

    // Process candidates with idempotency
    for (const candidate of candidatesToIssue) {
      // Check existing certificate for (hackathonId, userId, type)
      const existing = await db.certificate.findUnique({
        where: {
          hackathonId_userId_type: {
            hackathonId,
            userId: candidate.userId,
            type: candidate.type,
          },
        },
      });

      // Idempotent: If already ISSUED, skip
      if (existing && existing.status === CertificateStatus.ISSUED) {
        continue;
      }

      const year = new Date(startDate).getFullYear();
      const randSuffix = randomBytes(3).toString("hex").toUpperCase();
      const certificateId = existing?.certificateId || `NEX-${year}-${randSuffix}`;
      const verificationCode =
        existing?.verificationCode ||
        `CERT-${randomBytes(12).toString("hex").toUpperCase()}`;

      // Step A: Create or update record with status PENDING
      const certRecord = existing
        ? await db.certificate.update({
            where: { id: existing.id },
            data: {
              status: CertificateStatus.PENDING,
              recipientName: candidate.recipientName,
              hackathonTitle,
              collegeName,
              startDate,
              endDate,
              format,
              location,
              teamName: candidate.teamName,
              position: candidate.position,
              signatories,
            },
          })
        : await db.certificate.create({
            data: {
              hackathonId,
              userId: candidate.userId,
              type: candidate.type,
              status: CertificateStatus.PENDING,
              certificateId,
              verificationCode,
              recipientName: candidate.recipientName,
              hackathonTitle,
              collegeName,
              startDate,
              endDate,
              format,
              location,
              teamName: candidate.teamName,
              position: candidate.position,
              signatories,
            },
          });

      // Step B: Generate PDF
      const verifyUrl = `${baseUrl.replace(/\/$/, "")}/certificates/verify/${verificationCode}`;
      const pdfBuffer = await generateCertificatePdf({
        certificateId,
        verificationCode,
        verifyUrl,
        type: candidate.type,
        recipientName: candidate.recipientName,
        hackathonTitle,
        collegeName,
        startDate,
        endDate,
        format,
        location,
        teamName: candidate.teamName,
        position: candidate.position,
        issuedAt: certRecord.issuedAt,
        signatories,
      });

      // Step C: Store PDF in private storage
      const storageKey = await CertificateStorageService.storePdf(
        hackathonId,
        certificateId,
        pdfBuffer
      );

      // Step D: Transition to ISSUED
      await db.certificate.update({
        where: { id: certRecord.id },
        data: {
          status: CertificateStatus.ISSUED,
          storageKey,
        },
      });

      issuedCount++;
    }

    return { success: true, count: issuedCount };
  }

  static async getHackathonCertificates(user: AuthUser, hackathonId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.certificate.findMany({
      where: { hackathonId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  static async getMyCertificates(user: AuthUser) {
    return db.certificate.findMany({
      where: {
        userId: user.id,
        status: { in: [CertificateStatus.ISSUED, CertificateStatus.REVOKED] },
      },
      include: {
        hackathon: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  static async getById(user: AuthUser, id: string) {
    const cert = await db.certificate.findUnique({
      where: { id },
      include: {
        hackathon: { select: { id: true, title: true, organizationId: true } },
        user: { select: { id: true, name: true } },
      },
    });
    if (!cert) throw AppError.notFound("Certificate not found");

    // Owner can access
    if (cert.userId === user.id) {
      return cert;
    }

    // Otherwise check admin permission
    await this.getHackathonAndVerifyAdmin(user, cert.hackathonId);
    return cert;
  }

  static async downloadCertificate(user: AuthUser, certificateIdOrCode: string) {
    const cert = await db.certificate.findFirst({
      where: {
        OR: [
          { id: certificateIdOrCode },
          { certificateId: certificateIdOrCode },
          { verificationCode: certificateIdOrCode },
        ],
      },
      include: {
        hackathon: { select: { id: true, organizationId: true } },
      },
    });

    if (!cert) {
      throw AppError.notFound("Certificate not found");
    }

    // Permission Check: Owner or Hackathon Admin
    if (cert.userId !== user.id) {
      // Must be an admin of the hackathon's college/org
      await this.getHackathonAndVerifyAdmin(user, cert.hackathonId);
    }

    if (cert.status === CertificateStatus.PENDING || !cert.storageKey) {
      throw AppError.businessRule(
        "INVALID_STATE",
        "Certificate PDF is still being generated."
      );
    }

    const pdfBuffer = await CertificateStorageService.getPdfBuffer(cert.storageKey);
    const sanitizedName = cert.recipientName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${cert.certificateId}_${sanitizedName}.pdf`;

    return {
      pdfBuffer,
      filename,
      contentType: "application/pdf",
    };
  }

  static async downloadAllZip(user: AuthUser, hackathonId: string) {
    const hackathon = await this.getHackathonAndVerifyAdmin(user, hackathonId);

    const certificates = await db.certificate.findMany({
      where: {
        hackathonId,
        status: CertificateStatus.ISSUED,
        storageKey: { not: null },
      },
    });

    if (certificates.length === 0) {
      throw AppError.notFound("No issued certificates found for this hackathon");
    }

    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));

    const zipPromise = new Promise<Buffer>((resolve, reject) => {
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", (err: Error) => reject(err));
    });

    for (const cert of certificates) {
      try {
        const buffer = await CertificateStorageService.getPdfBuffer(cert.storageKey!);
        const sanitizedName = cert.recipientName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const entryName = `${cert.certificateId}_${sanitizedName}.pdf`;
        archive.append(buffer, { name: entryName });
      } catch (err) {
        console.warn(`Could not add cert ${cert.id} to zip:`, err);
      }
    }

    await archive.finalize();
    const zipBuffer = await zipPromise;

    return {
      zipBuffer,
      filename: `${hackathon.slug}-certificates.zip`,
      contentType: "application/zip",
    };
  }

  static async revoke(
    user: AuthUser,
    hackathonId: string,
    certificateId: string,
    reason?: string
  ) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);

    const cert = await db.certificate.findFirst({
      where: {
        id: certificateId,
        hackathonId,
      },
    });

    if (!cert) {
      throw AppError.notFound("Certificate not found for this event");
    }

    const updated = await db.certificate.update({
      where: { id: cert.id },
      data: {
        status: CertificateStatus.REVOKED,
        revokedAt: new Date(),
        revocationReason: reason || "Revoked by event administrator",
      },
    });

    return {
      success: true,
      certificateId: updated.certificateId,
      status: updated.status,
      revokedAt: updated.revokedAt,
    };
  }

  static async verify(code: string) {
    const cert = await db.certificate.findFirst({
      where: {
        OR: [{ verificationCode: code }, { certificateId: code }],
      },
    });

    if (!cert) {
      return {
        valid: false,
        status: "NOT_FOUND",
      };
    }

    if (cert.status === CertificateStatus.REVOKED) {
      return {
        valid: false,
        status: "REVOKED",
        holder: cert.recipientName,
        hackathon: cert.hackathonTitle,
        college: cert.collegeName,
        issuedAt: cert.issuedAt,
        revokedAt: cert.revokedAt,
        revocationReason: cert.revocationReason,
      };
    }

    if (cert.status === CertificateStatus.PENDING) {
      return {
        valid: false,
        status: "PENDING",
      };
    }

    return {
      valid: true,
      status: "VALID",
      certificateId: cert.certificateId,
      holder: cert.recipientName,
      hackathon: cert.hackathonTitle,
      college: cert.collegeName,
      type: cert.type,
      issuedAt: cert.issuedAt,
    };
  }
}
