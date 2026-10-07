import { z } from "zod";
import { OrganizationType, OrgRole } from "@prisma/client";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  type: z.nativeEnum(OrganizationType).default(OrganizationType.COLLEGE),
  description: z.string().max(1000).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  allowedEmailDomains: z.array(z.string()).optional().default([]),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  allowedEmailDomains: z.array(z.string()).optional(),
});

export const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrgRole),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(OrgRole),
});
