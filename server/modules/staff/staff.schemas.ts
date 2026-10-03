import { z } from "zod";
import { HackathonStaffRole } from "@prisma/client";

export const InviteStaffSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(HackathonStaffRole),
});

export const ProcessStaffInviteSchema = z.object({
  token: z.string().min(1),
});
