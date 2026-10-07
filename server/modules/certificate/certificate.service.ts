import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { z } from "zod";
import { IssueCertificatesSchema } from "./certificate.schemas";
import { randomBytes } from "crypto";
import { CertificateType } from "@prisma/client";

export class CertificateService {
  private static async getHackathonAndVerifyAdmin(user: AuthUser, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({
      where: { id: hackathonId },
      include: { organization: true },
    });
    if (!hackathon) throw AppError.notFound("Hackathon not found");

    const membership = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
    });
    if (!can(user, "hackathon:update", { orgRole: membership?.role })) {
      throw AppError.forbidden("Permission denied.");
    }
    return hackathon;
  }

  static async issueBulk(user: AuthUser, hackathonId: string, data: z.infer<typeof IssueCertificatesSchema>) {
    const hackathon = await this.getHackathonAndVerifyAdmin(user, hackathonId);
    
    // Simplification for the sake of the exercise
    const newCertificates = [];
    
    if (data.types.includes(CertificateType.PARTICIPATION)) {
      const attendees = await db.registration.findMany({
        where: { hackathonId, checkedInAt: { not: null } },
      });
      for (const att of attendees) {
        newCertificates.push({
          hackathonId,
          userId: att.userId,
          type: CertificateType.PARTICIPATION,
          verificationCode: "CERT-" + randomBytes(6).toString("hex").toUpperCase(),
        });
      }
    }

    if (data.types.includes(CertificateType.WINNER)) {
      const winningSubmissions = await db.submission.findMany({
        where: { hackathonId, awards: { some: {} } },
        include: { team: { include: { members: { include: { registration: true } } } } },
      });

      for (const sub of winningSubmissions) {
        for (const member of sub.team.members) {
          newCertificates.push({
            hackathonId,
            userId: member.registration.userId,
            type: CertificateType.WINNER,
            verificationCode: "CERT-" + randomBytes(6).toString("hex").toUpperCase(),
          });
        }
      }
    }
    
    if (newCertificates.length > 0) {
      // Upsert using skipDuplicates to make it idempotent
      await db.certificate.createMany({
        data: newCertificates,
        skipDuplicates: true,
      });
    }

    return { success: true, count: newCertificates.length };
  }

  static async getHackathonCertificates(user: AuthUser, hackathonId: string) {
    await this.getHackathonAndVerifyAdmin(user, hackathonId);
    return db.certificate.findMany({
      where: { hackathonId },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  static async getMyCertificates(user: AuthUser) {
    return db.certificate.findMany({
      where: { userId: user.id },
      include: { hackathon: { select: { title: true } } },
    });
  }

  static async getById(user: AuthUser, id: string) {
    const cert = await db.certificate.findUnique({
      where: { id },
      include: { hackathon: { select: { title: true } }, user: { select: { name: true } } },
    });
    if (!cert) throw AppError.notFound("Not found");
    if (cert.userId !== user.id) throw AppError.forbidden("Not your certificate");

    return cert;
  }

  static async verify(code: string) {
    const cert = await db.certificate.findUnique({
      where: { verificationCode: code },
      include: { hackathon: { select: { title: true } }, user: { select: { name: true } } },
    });
    
    if (!cert) return { valid: false };

    return {
      valid: true,
      holder: cert.user.name,
      hackathon: cert.hackathon.title,
      type: cert.type,
      issuedAt: cert.issuedAt,
    };
  }
}
