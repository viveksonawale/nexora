import { z } from "zod";
import { RequestedRole } from "@prisma/client";

export const SubmitVerificationSchema = z.object({
  role: z.nativeEnum(RequestedRole),
  organizationId: z.string().optional().nullable(),
  newCollegeName: z.string().max(120).optional().nullable(),
  details: z.object({
    fullName: z.string().min(2, "Full name is required").max(100),
    // Student fields
    branch: z.string().max(100).optional(),
    year: z.string().max(20).optional(),
    rollNumber: z.string().max(50).optional(),
    // Organizer fields
    designation: z.string().max(100).optional(),
    officialEmail: z.string().email().optional().or(z.literal("")),
    // Judge fields
    organization: z.string().max(100).optional(),
    expertiseAreas: z.array(z.string()).optional(),
    linkedinUrl: z.string().url("Must be a valid LinkedIn URL").optional().or(z.literal("")),
  }),
  idCardStorageKey: z.string().optional().nullable().or(z.literal("")),
});

export const ReviewVerificationSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().max(500).optional(),
});
