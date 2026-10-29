import { z } from "zod";
import { OrganizationStatus, UserStatus, PlatformRole, HackathonStaffRole, HackathonStatus } from "@prisma/client";

export const QueryOrganizationsSchema = z.object({
  status: z.nativeEnum(OrganizationStatus).optional(),
});

export const QueryUsersSchema = z.object({
  q: z.string().optional(),
});

export const UpdatePlatformRoleSchema = z.object({
  platformRole: z.nativeEnum(PlatformRole),
});

export const AdminAssignRoleSchema = z.object({
  userId: z.string().min(1),
  hackathonId: z.string().min(1),
  role: z.nativeEnum(HackathonStaffRole),
});

export const AdminRevokeRoleSchema = z.object({
  userId: z.string().min(1),
  hackathonId: z.string().min(1),
  role: z.nativeEnum(HackathonStaffRole).optional(),
  staffId: z.string().optional(),
});

export const CreateSkillSchema = z.object({
  name: z.string().min(1),
});

export const UpdateSkillSchema = z.object({
  name: z.string().min(1),
});

export const AdminCreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  platformRole: z.nativeEnum(PlatformRole).default(PlatformRole.USER),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
});

export const AdminUpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  platformRole: z.nativeEnum(PlatformRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  headline: z.string().optional(),
});

export const AdminCreateHackathonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  organizationId: z.string().min(1, "Organization is required"),
  tagline: z.string().optional(),
  description: z.string().optional(),
  mode: z.enum(["ONLINE", "IN_PERSON", "HYBRID"]).default("ONLINE"),
  startsAt: z.string().datetime().or(z.date()),
  endsAt: z.string().datetime().or(z.date()),
  submissionDeadline: z.string().datetime().or(z.date()).optional(),
  registrationOpensAt: z.string().datetime().or(z.date()).optional(),
  registrationClosesAt: z.string().datetime().or(z.date()).optional(),
  maxTeamSize: z.number().int().min(1).default(4),
});

export const AdminUpdateHackathonSchema = z.object({
  title: z.string().min(3).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  mode: z.enum(["ONLINE", "IN_PERSON", "HYBRID"]).optional(),
  status: z.nativeEnum(HackathonStatus).optional(),
  startsAt: z.string().datetime().or(z.date()).optional(),
  endsAt: z.string().datetime().or(z.date()).optional(),
  submissionDeadline: z.string().datetime().or(z.date()).optional(),
  maxTeamSize: z.number().int().min(1).optional(),
});

