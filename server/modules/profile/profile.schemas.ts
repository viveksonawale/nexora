import { z } from "zod";

export const updateMeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
});

export const updateProfileSchema = z.object({
  headline: z.string().trim().max(120).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  avatarFileId: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  contactEmail: z.string().trim().email().optional().nullable(),
  showContactEmail: z.boolean().optional(),
  githubUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  portfolioUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  lookingForTeam: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export const educationSchema = z.object({
  institution: z.string().trim().min(1, "Institution is required").max(200),
  degree: z.string().trim().min(1, "Degree is required").max(100),
  fieldOfStudy: z.string().trim().max(100).optional().nullable(),
  startYear: z.number().int().min(1950).max(2100),
  endYear: z.number().int().min(1950).max(2100).optional().nullable(),
  isCurrent: z.boolean().default(false),
  grade: z.string().trim().max(50).optional().nullable(),
  organizationId: z.string().optional().nullable(),
});

export const updateEducationSchema = educationSchema.partial();

export const experienceSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),
  title: z.string().trim().min(1, "Title is required").max(100),
  description: z.string().trim().max(2000).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  isCurrent: z.boolean().default(false),
});

export const updateExperienceSchema = experienceSchema.partial();

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(150),
  description: z.string().trim().max(2000).optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
  liveUrl: z.string().url().optional().nullable(),
  techStack: z.array(z.string().trim().min(1)).default([]),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateProjectSchema = projectSchema.partial();

export const achievementSchema = z.object({
  kind: z.enum(["CERTIFICATION", "AWARD", "PUBLICATION", "OTHER"]).default("OTHER"),
  title: z.string().trim().min(1, "Title is required").max(150),
  issuer: z.string().trim().max(150).optional().nullable(),
  issuedOn: z.string().datetime().optional().nullable(),
  url: z.string().url().optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const updateAchievementSchema = achievementSchema.partial();

export const skillsSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string().trim().min(1).max(50),
      level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("INTERMEDIATE"),
    })
  ),
});
