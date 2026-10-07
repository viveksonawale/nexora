import { z } from "zod";
import { MediaKind } from "@prisma/client";

export const UpsertSubmissionSchema = z.object({
  title: z.string().min(2).max(100),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  trackId: z.string().optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
  demoUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  presentationUrl: z.string().url().optional().nullable(),
  techStack: z.array(z.string()).optional().default([]),
});

export const SubmitSubmissionSchema = z.object({
  // Minimal fields required for final submission
  title: z.string().min(2),
  description: z.string().min(10),
});

export const AddMediaSchema = z.object({
  fileAssetId: z.string().optional(),
  url: z.string().url().optional(),
  kind: z.nativeEnum(MediaKind),
  caption: z.string().max(200).optional(),
}).refine(data => data.fileAssetId || data.url, {
  message: "Must provide either fileAssetId or url",
});

export const DisqualifySchema = z.object({
  note: z.string().min(1),
});
