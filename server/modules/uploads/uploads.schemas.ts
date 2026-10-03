import { z } from "zod";

export const presignUploadSchema = z.object({
  purpose: z.enum([
    "AVATAR",
    "ORG_LOGO",
    "HACKATHON_BANNER",
    "HACKATHON_LOGO",
    "SPONSOR_LOGO",
    "SUBMISSION_MEDIA",
  ]),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().positive("Size must be positive"),
});
