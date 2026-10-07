import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AuthUser, can } from "@/server/policies/policy";
import { z } from "zod";
import { CreateAnnouncementSchema, UpdateAnnouncementSchema } from "./announcement.schemas";
import { AnnouncementAudience } from "@prisma/client";

export class AnnouncementService {
  private static async getHackathonAndVerifyStaff(user: AuthUser, hackathonId: string) {
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

  static async create(user: AuthUser, hackathonId: string, data: z.infer<typeof CreateAnnouncementSchema>) {
    await this.getHackathonAndVerifyStaff(user, hackathonId);

    const announcement = await db.announcement.create({
      data: {
        hackathonId,
        authorId: user.id,
        title: data.title,
        body: data.body,
        audience: data.audience,
        pinned: data.pinned,
      },
    });

    // TODO: Send email based on data.sendEmail flag and audience
    
    return announcement;
  }

  static async update(user: AuthUser, id: string, data: z.infer<typeof UpdateAnnouncementSchema>) {
    const announcement = await db.announcement.findUnique({ where: { id } });
    if (!announcement) throw AppError.notFound("Not found");
    await this.getHackathonAndVerifyStaff(user, announcement.hackathonId);

    return db.announcement.update({
      where: { id },
      data,
    });
  }

  static async delete(user: AuthUser, id: string) {
    const announcement = await db.announcement.findUnique({ where: { id } });
    if (!announcement) throw AppError.notFound("Not found");
    await this.getHackathonAndVerifyStaff(user, announcement.hackathonId);

    await db.announcement.delete({ where: { id } });
    return { success: true };
  }

  static async list(user: AuthUser | null, hackathonId: string) {
    const hackathon = await db.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) throw AppError.notFound("Not found");

    let isStaff = false;
    let isParticipant = false;
    let isJudgeOrMentor = false;

    if (user) {
      const membership = await db.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: hackathon.organizationId, userId: user.id } },
      });
      isStaff = can(user, "hackathon:update", { orgRole: membership?.role });
      
      const reg = await db.registration.findUnique({
        where: { hackathonId_userId: { hackathonId, userId: user.id } },
      });
      if (reg && reg.status === "APPROVED") isParticipant = true;

      const staff = await db.hackathonStaff.findFirst({
        where: { hackathonId, userId: user.id, status: "ACTIVE" },
      });
      if (staff) isJudgeOrMentor = true;
    }

    const validAudiences: AnnouncementAudience[] = ["ALL"];
    
    if (isStaff) {
      // Staff can see everything
      return db.announcement.findMany({
        where: { hackathonId },
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        include: { author: { select: { name: true } } },
      });
    }

    if (isParticipant) validAudiences.push("PARTICIPANTS");
    if (isJudgeOrMentor) {
      validAudiences.push("JUDGES");
      validAudiences.push("MENTORS");
    }

    return db.announcement.findMany({
      where: {
        hackathonId,
        audience: { in: validAudiences },
      },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      include: { author: { select: { name: true } } },
    });
  }
}
