import { z } from "zod";

export const CreateTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional().nullable(),
  lookingForMembers: z.boolean().default(false),
  lookingForSkills: z.array(z.string()).optional().default([]),
});

export const UpdateTeamSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional().nullable(),
  lookingForMembers: z.boolean().optional(),
  lookingForSkills: z.array(z.string()).optional(),
});

export const QueryTeamsSchema = z.object({
  lookingForMembers: z.enum(["true", "false"]).optional(),
  skill: z.string().optional(),
});

export const JoinTeamSchema = z.object({
  inviteCode: z.string().min(1),
});

export const InviteMemberSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
}).refine(data => data.userId || data.email, {
  message: "Must provide either userId or email",
});

export const TransferLeadershipSchema = z.object({
  userId: z.string().min(1),
});
