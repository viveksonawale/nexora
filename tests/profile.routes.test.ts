import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getMeHandler } from "@/app/api/v1/me/route";
import { PUT as updateProfileHandler } from "@/app/api/v1/me/profile/route";
import { GET as searchSkillsHandler } from "@/app/api/v1/skills/route";
import { GET as publicProfileHandler } from "@/app/api/v1/profiles/[slug]/route";
import { db } from "@/server/lib/db";
import { signAccessToken } from "@/server/modules/auth/tokens";

describe("Profile and Discovery Routes", () => {
  it("GET /api/v1/me - returns user roles, onboarding, and memberships", async () => {
    const token = await signAccessToken({
      userId: "u_alice",
      email: "alice@test.com",
      platformRole: "USER",
    });

    vi.spyOn(db.user, "findUnique").mockResolvedValue({
      id: "u_alice",
      name: "Alice",
      email: "alice@test.com",
      platformRole: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      profile: {
        id: "prof_alice",
        slug: "alice",
        avatarUrl: null,
        headline: "Engineer",
        completenessScore: 50,
        onboardingCompleted: true,
        lookingForTeam: true,
      },
      orgMemberships: [],
      staffRoles: [],
    } as unknown as ReturnType<typeof db.user.findUnique> extends Promise<infer U> ? U : never);

    const req = new NextRequest("http://localhost:3000/api/v1/me", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const res = await getMeHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe("Alice");
    expect(body.data.profile.headline).toBe("Engineer");
  });

  it("PUT /api/v1/me/profile - updates profile details and updates completeness", async () => {
    const token = await signAccessToken({
      userId: "u_alice",
      email: "alice@test.com",
      platformRole: "USER",
    });

    vi.spyOn(db.user, "findUnique").mockResolvedValueOnce({
      id: "u_alice",
      email: "alice@test.com",
      platformRole: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    } as unknown as ReturnType<typeof db.user.findUnique> extends Promise<infer U> ? U : never);

    vi.spyOn(db.profile, "update").mockResolvedValueOnce({
      id: "prof_alice",
      userId: "u_alice",
      slug: "alice",
      headline: "Senior Architect",
      bio: "Building distributed systems",
      location: "San Francisco",
      avatarUrl: null,
      contactEmail: null,
      showContactEmail: false,
      githubUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
      twitterUrl: null,
      lookingForTeam: false,
      isPublic: true,
      completenessScore: 25,
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(db.profile, "findUnique").mockResolvedValueOnce({
      id: "prof_alice",
      userId: "u_alice",
      headline: "Senior Architect",
      bio: "Building distributed systems",
      education: [],
      skills: [],
      projects: [],
      experiences: [],
      achievements: [],
    } as unknown as ReturnType<typeof db.profile.findUnique> extends Promise<infer U> ? U : never);

    const req = new NextRequest("http://localhost:3000/api/v1/me/profile", {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        headline: "Senior Architect",
        bio: "Building distributed systems",
      }),
    });

    const res = await updateProfileHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.headline).toBe("Senior Architect");
  });

  it("GET /api/v1/skills?q= - returns matching skills from catalogue", async () => {
    vi.spyOn(db.skill, "findMany").mockResolvedValueOnce([
      { id: "sk_1", name: "TypeScript", slug: "typescript" },
      { id: "sk_2", name: "TypeORM", slug: "typeorm" },
    ]);

    const req = new NextRequest("http://localhost:3000/api/v1/skills?q=type", {
      method: "GET",
    });

    const res = await searchSkillsHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe("TypeScript");
  });

  it("GET /api/v1/profiles/:slug - returns public profile data", async () => {
    vi.spyOn(db.profile, "findUnique").mockResolvedValueOnce({
      id: "prof_alice",
      userId: "u_alice",
      slug: "alice-smith",
      headline: "Engineer",
      bio: "Dev",
      location: "NY",
      avatarUrl: "https://example.com/avatar.png",
      contactEmail: "alice@private.com",
      showContactEmail: false,
      githubUrl: "https://github.com/alice",
      linkedinUrl: null,
      portfolioUrl: null,
      twitterUrl: null,
      lookingForTeam: true,
      isPublic: true,
      user: { id: "u_alice", name: "Alice Smith" },
      education: [],
      experiences: [],
      projects: [],
      achievements: [],
      skills: [],
    } as unknown as ReturnType<typeof db.profile.findUnique> extends Promise<infer U> ? U : never);

    const req = new NextRequest("http://localhost:3000/api/v1/profiles/alice-smith", {
      method: "GET",
    });

    const res = await publicProfileHandler(req, { params: Promise.resolve({ slug: "alice-smith" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe("Alice Smith");
    expect(body.data.contactEmail).toBeNull(); // Privacy protected!
  });
});
