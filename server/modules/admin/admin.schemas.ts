import { z } from "zod";
import { OrganizationStatus, UserStatus } from "@prisma/client";

export const QueryOrganizationsSchema = z.object({
  status: z.nativeEnum(OrganizationStatus).optional(),
});

export const QueryUsersSchema = z.object({
  q: z.string().optional(),
});

export const CreateSkillSchema = z.object({
  name: z.string().min(1),
});

export const UpdateSkillSchema = z.object({
  name: z.string().min(1),
});
