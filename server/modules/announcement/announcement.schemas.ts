import { z } from "zod";
import { AnnouncementAudience } from "@prisma/client";

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(2).max(150),
  body: z.string().min(5),
  audience: z.nativeEnum(AnnouncementAudience).default("ALL"),
  pinned: z.boolean().default(false),
  sendEmail: z.boolean().default(false).optional(), // Used in service layer to trigger email jobs
});

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial().omit({ sendEmail: true });
