import { z } from "zod";
import { HackathonMode, Visibility, SponsorTier, QuestionType } from "@prisma/client";

export const CreateHackathonSchema = z.object({
  title: z.string().min(2).max(100),
  mode: z.nativeEnum(HackathonMode).default(HackathonMode.OFFLINE),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export const UpdateHackathonSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().optional().nullable(),
  rules: z.string().optional().nullable(),
  eligibility: z.string().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  mode: z.nativeEnum(HackathonMode).optional(),
  venueName: z.string().max(200).optional().nullable(),
  venueAddress: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  onlineUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  registrationOpensAt: z.coerce.date().optional().nullable(),
  registrationClosesAt: z.coerce.date().optional().nullable(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  submissionDeadline: z.coerce.date().optional().nullable(),
  judgingStartsAt: z.coerce.date().optional().nullable(),
  judgingEndsAt: z.coerce.date().optional().nullable(),
  minTeamSize: z.number().int().min(1).optional(),
  maxTeamSize: z.number().int().min(1).optional(),
  maxParticipants: z.number().int().min(1).optional().nullable(),
  requireApproval: z.boolean().optional(),
  blindJudging: z.boolean().optional(),
});

export const QueryHackathonSchema = z.object({
  q: z.string().optional(),
  mode: z.nativeEnum(HackathonMode).optional(),
  phase: z.string().optional(),
  city: z.string().optional(),
  tag: z.string().optional(),
  orgSlug: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(["startsAt", "deadline", "newest"]).optional().default("startsAt"),
});

// Sub-resources

export const TrackSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const PrizeSchema = z.object({
  trackId: z.string().optional().nullable(),
  sponsorId: z.string().optional().nullable(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  rank: z.number().int().optional().nullable(),
  amount: z.number().optional().nullable(),
  currency: z.string().default("INR"),
  sortOrder: z.number().int().default(0),
});

export const SponsorSchema = z.object({
  name: z.string().min(1).max(100),
  tier: z.nativeEnum(SponsorTier).default(SponsorTier.PARTNER),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const ScheduleItemSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional().nullable(),
});

export const FaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
  sortOrder: z.number().int().default(0),
});

export const RegistrationQuestionSchema = z.object({
  label: z.string().min(1).max(200),
  type: z.nativeEnum(QuestionType).default(QuestionType.TEXT),
  options: z.any().optional(), // usually array of strings if select
  required: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const JudgingCriterionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  maxScore: z.number().int().min(1).default(10),
  weight: z.number().min(0).max(10).default(1),
  sortOrder: z.number().int().default(0),
});
