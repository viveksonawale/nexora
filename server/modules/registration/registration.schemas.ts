import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";

export const CreateRegistrationSchema = z.object({
  answers: z.record(z.string(), z.any()).optional().default({}),
});

export const UpdateRegistrationStatusSchema = z.object({
  status: z.nativeEnum(RegistrationStatus),
});

export const BulkUpdateRegistrationStatusSchema = z.object({
  ids: z.array(z.string()),
  status: z.nativeEnum(RegistrationStatus),
});

export const CheckInSchema = z.object({
  qrToken: z.string().optional(),
  registrationId: z.string().optional(),
}).refine(data => data.qrToken || data.registrationId, {
  message: "Must provide either qrToken or registrationId",
});

export const QueryRegistrationSchema = z.object({
  status: z.nativeEnum(RegistrationStatus).optional(),
  q: z.string().optional(),
  checkedIn: z.enum(["true", "false"]).optional(),
  hasTeam: z.enum(["true", "false"]).optional(),
});
