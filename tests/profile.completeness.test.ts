import { describe, it, expect } from "vitest";
import { calculateCompleteness } from "@/server/modules/profile/profile.service";

describe("Profile Completeness Calculation", () => {
  it("returns 0 points and all missing sections for an empty profile", () => {
    const emptyProfile = {};
    const { score, missing } = calculateCompleteness(emptyProfile);

    expect(score).toBe(0);
    expect(missing).toHaveLength(7);
  });

  it("calculates full 100 points for a complete profile", () => {
    const fullProfile = {
      avatarUrl: "https://example.com/avatar.png",
      headline: "Full-stack Developer",
      bio: "Passionate engineer building hackathons",
      location: "San Francisco, CA",
      githubUrl: "https://github.com/alice",
      education: [{ id: "edu_1", institution: "MIT", degree: "B.S." }],
      skills: [
        { id: "sk_1", name: "TypeScript" },
        { id: "sk_2", name: "React" },
        { id: "sk_3", name: "Node.js" },
      ],
      projects: [{ id: "proj_1", title: "Nexora" }],
      experiences: [{ id: "exp_1", company: "Google", title: "SWE Intern" }],
      achievements: [],
    };

    const { score, missing } = calculateCompleteness(fullProfile);

    expect(score).toBe(100);
    expect(missing).toHaveLength(0);
  });

  it("awards points correctly for partial profile components", () => {
    // Avatar (10) + Education (20) = 30
    const partialProfile = {
      avatarUrl: "https://example.com/avatar.png",
      education: [{ id: "edu_1", institution: "Stanford", degree: "B.S." }],
    };

    const { score, missing } = calculateCompleteness(partialProfile);

    expect(score).toBe(30);
    expect(missing).toContain("Headline and bio");
    expect(missing).toContain("At least three skills");
    expect(missing).toContain("At least one portfolio project");
  });
});
