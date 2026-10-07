import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { AchievementKind, SkillLevel } from "@prisma/client";

export interface CompletenessResult {
  score: number;
  missing: string[];
}

export function calculateCompleteness(profile: {
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  twitterUrl?: string | null;
  education?: Array<unknown>;
  skills?: Array<unknown>;
  projects?: Array<unknown>;
  experiences?: Array<unknown>;
  achievements?: Array<unknown>;
}): CompletenessResult {
  let score = 0;
  const missing: string[] = [];

  // Avatar: 10 pts
  if (profile.avatarUrl && profile.avatarUrl.trim().length > 0) {
    score += 10;
  } else {
    missing.push("Avatar photo");
  }

  // Headline + Bio: 15 pts
  if (
    profile.headline &&
    profile.headline.trim().length > 0 &&
    profile.bio &&
    profile.bio.trim().length > 0
  ) {
    score += 15;
  } else {
    missing.push("Headline and bio");
  }

  // Location + at least one link: 10 pts
  const hasLink = Boolean(
    profile.githubUrl?.trim() ||
      profile.linkedinUrl?.trim() ||
      profile.portfolioUrl?.trim() ||
      profile.twitterUrl?.trim()
  );
  if (profile.location && profile.location.trim().length > 0 && hasLink) {
    score += 10;
  } else {
    missing.push("Location and at least one social or portfolio link");
  }

  // Education (1+): 20 pts
  if (profile.education && profile.education.length >= 1) {
    score += 20;
  } else {
    missing.push("At least one education record");
  }

  // Skills (3+): 20 pts
  if (profile.skills && profile.skills.length >= 3) {
    score += 20;
  } else {
    missing.push("At least three skills");
  }

  // Projects (1+): 15 pts
  if (profile.projects && profile.projects.length >= 1) {
    score += 15;
  } else {
    missing.push("At least one portfolio project");
  }

  // Experience or achievement (1+): 10 pts
  const hasExpOrAch =
    (profile.experiences && profile.experiences.length >= 1) ||
    (profile.achievements && profile.achievements.length >= 1);
  if (hasExpOrAch) {
    score += 10;
  } else {
    missing.push("At least one work experience or achievement");
  }

  return { score, missing };
}

export async function refreshProfileCompleteness(profileId: string) {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    include: {
      education: true,
      skills: true,
      projects: true,
      experiences: true,
      achievements: true,
    },
  });

  if (!profile) return 0;

  const { score } = calculateCompleteness(profile);
  await db.profile.update({
    where: { id: profileId },
    data: { completenessScore: score },
  });

  return score;
}

export async function getMe(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          id: true,
          slug: true,
          avatarUrl: true,
          headline: true,
          completenessScore: true,
          onboardingCompleted: true,
          lookingForTeam: true,
        },
      },
      orgMemberships: {
        include: {
          organization: { select: { id: true, name: true, slug: true, logoUrl: true, status: true } },
        },
      },
      staffRoles: {
        where: { status: "ACTIVE" },
        include: {
          hackathon: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });

  if (!user) {
    throw new AppError("NOT_FOUND", "User not found", 404);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    platformRole: user.platformRole,
    status: user.status,
    emailVerified: !!user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    profile: user.profile,
    orgMemberships: user.orgMemberships.map((m) => ({
      orgId: m.organizationId,
      role: m.role,
      organization: m.organization,
    })),
    staffRoles: user.staffRoles.map((s) => ({
      hackathonId: s.hackathonId,
      role: s.role,
      hackathon: s.hackathon,
    })),
  };
}

export async function updateMe(userId: string, data: { name: string }) {
  const updated = await db.user.update({
    where: { id: userId },
    data: { name: data.name },
    select: { id: true, name: true, email: true, platformRole: true },
  });
  return updated;
}

export async function deleteMe(userId: string) {
  // Anonymize user data per spec
  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId } });
    await tx.emailToken.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        name: "Deleted User",
        email: `deleted_${userId}@anonymized.nexora.app`,
        passwordHash: null,
        status: "SUSPENDED",
      },
    });

    await tx.profile.updateMany({
      where: { userId },
      data: {
        headline: null,
        bio: null,
        location: null,
        avatarUrl: null,
        contactEmail: null,
        githubUrl: null,
        linkedinUrl: null,
        portfolioUrl: null,
        twitterUrl: null,
        isPublic: false,
        lookingForTeam: false,
      },
    });
  });

  return { message: "Account anonymized successfully" };
}

export async function getFullProfile(userId: string) {
  const profile = await db.profile.findUnique({
    where: { userId },
    include: {
      education: { orderBy: { startYear: "desc" } },
      experiences: { orderBy: { startDate: "desc" } },
      projects: { orderBy: { createdAt: "desc" } },
      achievements: { orderBy: { createdAt: "desc" } },
      skills: {
        include: { skill: true },
        orderBy: { skill: { name: "asc" } },
      },
      user: {
        select: { id: true, name: true, email: true, platformRole: true },
      },
    },
  });

  if (!profile) {
    throw new AppError("NOT_FOUND", "Profile not found", 404);
  }

  const { score, missing } = calculateCompleteness(profile);

  return {
    ...profile,
    completeness: { score, missing },
    skills: profile.skills.map((s) => ({
      id: s.skill.id,
      name: s.skill.name,
      slug: s.skill.slug,
      level: s.level,
    })),
  };
}

export async function updateProfileBasics(
  userId: string,
  data: {
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
    avatarUrl?: string | null;
    avatarFileId?: string | null;
    contactEmail?: string | null;
    showContactEmail?: boolean;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
    twitterUrl?: string | null;
    lookingForTeam?: boolean;
    isPublic?: boolean;
  }
) {
  let avatarUrl = data.avatarUrl;

  if (data.avatarFileId) {
    const file = await db.fileAsset.findFirst({
      where: { id: data.avatarFileId, ownerId: userId, status: "CONFIRMED" },
    });
    if (file && file.publicUrl) {
      avatarUrl = file.publicUrl;
    }
  }

  const profile = await db.profile.update({
    where: { userId },
    data: {
      headline: data.headline,
      bio: data.bio,
      location: data.location,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      contactEmail: data.contactEmail,
      showContactEmail: data.showContactEmail,
      githubUrl: data.githubUrl,
      linkedinUrl: data.linkedinUrl,
      portfolioUrl: data.portfolioUrl,
      twitterUrl: data.twitterUrl,
      lookingForTeam: data.lookingForTeam,
      isPublic: data.isPublic,
    },
  });

  await refreshProfileCompleteness(profile.id);
  return profile;
}

export async function completeOnboarding(userId: string) {
  const profile = await db.profile.findUnique({
    where: { userId },
    include: {
      education: true,
      skills: true,
    },
  });

  if (!profile) {
    throw new AppError("NOT_FOUND", "Profile not found", 404);
  }

  // Check minimum fields: headline or education or skills
  if (!profile.headline && profile.education.length === 0 && profile.skills.length === 0) {
    throw new AppError(
      "ONBOARDING_INCOMPLETE",
      "Please fill in at least a headline, an education entry, or a skill before completing onboarding",
      422
    );
  }

  const updated = await db.profile.update({
    where: { userId },
    data: { onboardingCompleted: true },
  });

  return { message: "Onboarding completed successfully", onboardingCompleted: updated.onboardingCompleted };
}

export async function getCompletenessScore(userId: string) {
  const profile = await db.profile.findUnique({
    where: { userId },
    include: {
      education: true,
      experiences: true,
      projects: true,
      achievements: true,
      skills: true,
    },
  });

  if (!profile) {
    throw new AppError("NOT_FOUND", "Profile not found", 404);
  }

  return calculateCompleteness(profile);
}

// ==========================================
// Education CRUD
// ==========================================
export async function listEducation(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  return db.education.findMany({
    where: { profileId: profile.id },
    orderBy: { startYear: "desc" },
  });
}

export async function addEducation(
  userId: string,
  data: {
    institution: string;
    degree: string;
    fieldOfStudy?: string | null;
    startYear: number;
    endYear?: number | null;
    isCurrent?: boolean;
    grade?: string | null;
    organizationId?: string | null;
  }
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const entry = await db.education.create({
    data: {
      profileId: profile.id,
      institution: data.institution,
      degree: data.degree,
      fieldOfStudy: data.fieldOfStudy,
      startYear: data.startYear,
      endYear: data.endYear,
      isCurrent: data.isCurrent || false,
      grade: data.grade,
      organizationId: data.organizationId,
    },
  });

  await refreshProfileCompleteness(profile.id);
  return entry;
}

export async function updateEducation(
  userId: string,
  id: string,
  data: Partial<{
    institution: string;
    degree: string;
    fieldOfStudy?: string | null;
    startYear: number;
    endYear?: number | null;
    isCurrent?: boolean;
    grade?: string | null;
    organizationId?: string | null;
  }>
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const existing = await db.education.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Education record not found", 404);

  const updated = await db.education.update({
    where: { id },
    data,
  });

  await refreshProfileCompleteness(profile.id);
  return updated;
}

export async function deleteEducation(userId: string, id: string) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const existing = await db.education.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Education record not found", 404);

  await db.education.delete({ where: { id } });
  await refreshProfileCompleteness(profile.id);
  return { message: "Education record deleted successfully" };
}

// ==========================================
// Experience CRUD
// ==========================================
export async function listExperience(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  return db.experience.findMany({
    where: { profileId: profile.id },
    orderBy: { startDate: "desc" },
  });
}

export async function addExperience(
  userId: string,
  data: {
    company: string;
    title: string;
    description?: string | null;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
  }
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const entry = await db.experience.create({
    data: {
      profileId: profile.id,
      company: data.company,
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isCurrent: data.isCurrent || false,
    },
  });

  await refreshProfileCompleteness(profile.id);
  return entry;
}

export async function updateExperience(
  userId: string,
  id: string,
  data: Partial<{
    company: string;
    title: string;
    description?: string | null;
    startDate: string;
    endDate?: string | null;
    isCurrent?: boolean;
  }>
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const existing = await db.experience.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Experience record not found", 404);

  const updated = await db.experience.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
    },
  });

  await refreshProfileCompleteness(profile.id);
  return updated;
}

export async function deleteExperience(userId: string, id: string) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const existing = await db.experience.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Experience record not found", 404);

  await db.experience.delete({ where: { id } });
  await refreshProfileCompleteness(profile.id);
  return { message: "Experience record deleted successfully" };
}

// ==========================================
// Projects CRUD
// ==========================================
export async function listProjects(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  return db.profileProject.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function addProject(
  userId: string,
  data: {
    title: string;
    description?: string | null;
    repoUrl?: string | null;
    liveUrl?: string | null;
    techStack?: string[];
    startDate?: string | null;
    endDate?: string | null;
  }
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const entry = await db.profileProject.create({
    data: {
      profileId: profile.id,
      title: data.title,
      description: data.description,
      repoUrl: data.repoUrl,
      liveUrl: data.liveUrl,
      techStack: data.techStack || [],
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });

  await refreshProfileCompleteness(profile.id);
  return entry;
}

export async function updateProject(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    description?: string | null;
    repoUrl?: string | null;
    liveUrl?: string | null;
    techStack?: string[];
    startDate?: string | null;
    endDate?: string | null;
  }>
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const existing = await db.profileProject.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Project record not found", 404);

  const updated = await db.profileProject.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
    },
  });

  await refreshProfileCompleteness(profile.id);
  return updated;
}

export async function deleteProject(userId: string, id: string) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const existing = await db.profileProject.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Project record not found", 404);

  await db.profileProject.delete({ where: { id } });
  await refreshProfileCompleteness(profile.id);
  return { message: "Project deleted successfully" };
}

// ==========================================
// Achievements CRUD
// ==========================================
export async function listAchievements(userId: string) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  return db.achievement.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function addAchievement(
  userId: string,
  data: {
    kind: AchievementKind;
    title: string;
    issuer?: string | null;
    issuedOn?: string | null;
    url?: string | null;
    description?: string | null;
  }
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const entry = await db.achievement.create({
    data: {
      profileId: profile.id,
      kind: data.kind,
      title: data.title,
      issuer: data.issuer,
      issuedOn: data.issuedOn ? new Date(data.issuedOn) : null,
      url: data.url,
      description: data.description,
    },
  });

  await refreshProfileCompleteness(profile.id);
  return entry;
}

export async function updateAchievement(
  userId: string,
  id: string,
  data: Partial<{
    kind: AchievementKind;
    title: string;
    issuer?: string | null;
    issuedOn?: string | null;
    url?: string | null;
    description?: string | null;
  }>
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const existing = await db.achievement.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Achievement record not found", 404);

  const updated = await db.achievement.update({
    where: { id },
    data: {
      ...data,
      issuedOn: data.issuedOn !== undefined ? (data.issuedOn ? new Date(data.issuedOn) : null) : undefined,
    },
  });

  await refreshProfileCompleteness(profile.id);
  return updated;
}

export async function deleteAchievement(userId: string, id: string) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  const existing = await db.achievement.findFirst({
    where: { id, profileId: profile.id },
  });
  if (!existing) throw new AppError("NOT_FOUND", "Achievement record not found", 404);

  await db.achievement.delete({ where: { id } });
  await refreshProfileCompleteness(profile.id);
  return { message: "Achievement deleted successfully" };
}

// ==========================================
// Skills Catalogue & User Skills
// ==========================================
export async function updateSkills(
  userId: string,
  skillsList: Array<{ name: string; level: SkillLevel }>
) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);

  // Normalize, deduplicate skills
  const normalized = new Map<string, { original: string; level: SkillLevel }>();
  for (const s of skillsList) {
    const cleanName = s.name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    if (slug && !normalized.has(slug)) {
      normalized.set(slug, { original: cleanName, level: s.level });
    }
  }

  await db.$transaction(async (tx) => {
    // Remove current user skills
    await tx.profileSkill.deleteMany({ where: { profileId: profile.id } });

    // Upsert each skill in catalogue & link to profile
    for (const [slug, item] of normalized.entries()) {
      let skill = await tx.skill.findUnique({ where: { slug } });
      if (!skill) {
        skill = await tx.skill.create({
          data: {
            name: item.original,
            slug,
          },
        });
      }

      await tx.profileSkill.create({
        data: {
          profileId: profile.id,
          skillId: skill.id,
          level: item.level,
        },
      });
    }
  });

  await refreshProfileCompleteness(profile.id);

  return db.profileSkill.findMany({
    where: { profileId: profile.id },
    include: { skill: true },
    orderBy: { skill: { name: "asc" } },
  });
}

export async function searchSkills(query: string, limit = 15) {
  if (!query || query.trim().length === 0) {
    return db.skill.findMany({
      take: limit,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
  }

  const clean = query.trim().toLowerCase();
  return db.skill.findMany({
    where: {
      OR: [
        { name: { contains: clean, mode: "insensitive" } },
        { slug: { contains: clean } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

// ==========================================
// Public Profile
// ==========================================
export async function getPublicProfile(slug: string) {
  const profile = await db.profile.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, name: true } },
      education: { orderBy: { startYear: "desc" } },
      experiences: { orderBy: { startDate: "desc" } },
      projects: { orderBy: { createdAt: "desc" } },
      achievements: { orderBy: { createdAt: "desc" } },
      skills: {
        include: { skill: true },
        orderBy: { skill: { name: "asc" } },
      },
    },
  });

  if (!profile || !profile.isPublic) {
    throw new AppError("NOT_FOUND", "Profile not found", 404);
  }

  return {
    id: profile.id,
    name: profile.user.name,
    slug: profile.slug,
    headline: profile.headline,
    bio: profile.bio,
    location: profile.location,
    avatarUrl: profile.avatarUrl,
    contactEmail: profile.showContactEmail ? profile.contactEmail : null,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
    portfolioUrl: profile.portfolioUrl,
    twitterUrl: profile.twitterUrl,
    lookingForTeam: profile.lookingForTeam,
    education: profile.education,
    experiences: profile.experiences,
    projects: profile.projects,
    achievements: profile.achievements,
    skills: profile.skills.map((s) => ({
      name: s.skill.name,
      slug: s.skill.slug,
      level: s.level,
    })),
  };
}

// ==========================================
// Auto-Generated Resume JSON
// ==========================================
export async function getResumeData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          education: { orderBy: { startYear: "desc" } },
          experiences: { orderBy: { startDate: "desc" } },
          projects: { orderBy: { createdAt: "desc" } },
          achievements: { orderBy: { createdAt: "desc" } },
          skills: { include: { skill: true } },
        },
      },
      registrations: {
        where: { status: "APPROVED" },
        include: {
          hackathon: {
            select: { id: true, title: true, slug: true, startsAt: true, endsAt: true },
          },
          teamMember: {
            include: {
              team: {
                include: {
                  submission: {
                    select: {
                      id: true,
                      title: true,
                      awards: { select: { id: true, prize: { select: { title: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      certificates: {
        include: {
          hackathon: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { issuedAt: "desc" },
      },
    },
  });

  if (!user || !user.profile) {
    throw new AppError("NOT_FOUND", "Profile not found", 404);
  }

  const p = user.profile;

  return {
    basics: {
      name: user.name,
      email: p.showContactEmail && p.contactEmail ? p.contactEmail : user.email,
      headline: p.headline,
      bio: p.bio,
      location: p.location,
      avatarUrl: p.avatarUrl,
      links: {
        github: p.githubUrl,
        linkedin: p.linkedinUrl,
        portfolio: p.portfolioUrl,
        twitter: p.twitterUrl,
      },
    },
    education: p.education.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      startYear: e.startYear,
      endYear: e.endYear,
      isCurrent: e.isCurrent,
      grade: e.grade,
    })),
    experience: p.experiences.map((exp) => ({
      company: exp.company,
      title: exp.title,
      description: exp.description,
      startDate: exp.startDate.toISOString(),
      endDate: exp.endDate ? exp.endDate.toISOString() : null,
      isCurrent: exp.isCurrent,
    })),
    projects: p.projects.map((prj) => ({
      title: prj.title,
      description: prj.description,
      repoUrl: prj.repoUrl,
      liveUrl: prj.liveUrl,
      techStack: prj.techStack,
      startDate: prj.startDate ? prj.startDate.toISOString() : null,
      endDate: prj.endDate ? prj.endDate.toISOString() : null,
    })),
    skills: p.skills.map((s) => ({
      name: s.skill.name,
      level: s.level,
    })),
    achievements: p.achievements.map((a) => ({
      kind: a.kind,
      title: a.title,
      issuer: a.issuer,
      issuedOn: a.issuedOn ? a.issuedOn.toISOString() : null,
      url: a.url,
      description: a.description,
    })),
    hackathons: user.registrations.map((r) => ({
      hackathon: r.hackathon,
      team: r.teamMember?.team.name,
      submission: r.teamMember?.team.submission
        ? {
            title: r.teamMember.team.submission.title,
            awards: r.teamMember.team.submission.awards.map((aw) => aw.prize.title),
          }
        : null,
    })),
    certificates: user.certificates.map((c) => ({
      id: c.id,
      verificationCode: c.verificationCode,
      type: c.type,
      issuedAt: c.issuedAt.toISOString(),
      hackathon: c.hackathon,
    })),
  };
}

// ==========================================
// Registrations, Submissions, Certificates
// ==========================================
export async function getMyRegistrations(userId: string) {
  return db.registration.findMany({
    where: { userId },
    include: {
      hackathon: {
        select: {
          id: true,
          title: true,
          slug: true,
          bannerUrl: true,
          mode: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
      },
      teamMember: {
        include: {
          team: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMySubmissions(userId: string) {
  return db.submission.findMany({
    where: {
      team: {
        members: {
          some: {
            registration: { userId },
          },
        },
      },
    },
    include: {
      hackathon: { select: { id: true, title: true, slug: true } },
      team: { select: { id: true, name: true } },
      track: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyCertificates(userId: string) {
  return db.certificate.findMany({
    where: { userId },
    include: {
      hackathon: { select: { id: true, title: true, slug: true, bannerUrl: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
}
