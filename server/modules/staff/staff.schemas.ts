import { z } from "zod";
import { HackathonStaffRole } from "@prisma/client";

export const InviteStaffSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(HackathonStaffRole),
});

export const ProcessStaffInviteSchema = z.object({
  token: z.string().min(1),
});

export const AssignStaffDirectSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(HackathonStaffRole),
}).refine((data) => data.userId || data.email, {
  message: "Either userId or email is required",
});

export const RevokeStaffRoleSchema = z.object({
  userId: z.string().optional(),
  staffId: z.string().optional(),
  role: z.nativeEnum(HackathonStaffRole).optional(),
});
