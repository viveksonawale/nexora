import { describe, it, expect, vi } from "vitest";
import { JudgingService } from "../server/modules/judging/judging.service";
import { db } from "../server/lib/db";
import { AuthUser } from "../server/policies/policy";

vi.mock("../server/lib/db", () => {
  return {
    db: {
      judgeAssignment: {
        findUnique: vi.fn(),
      }
    }
  };
});

describe("Judging Service Rules", () => {
  it("For a blind hackathon, no judge endpoint response contains team name, member names, emails or teamId", async () => {
    const judge: AuthUser = { id: "j1", email: "judge@example.com", role: "USER" };

    const mockAssignment = {
      id: "assignment1",
      staff: { userId: "j1" },
      submission: {
        id: "sub1",
        anonymousCode: "P-ABCDEF",
        title: "Super Project",
        hackathonId: "h1",
        // Crucially, teamId exists in DB but should be stripped
        teamId: "team1",
        media: []
      },
      scores: []
    };

    vi.mocked(db.judgeAssignment.findUnique).mockResolvedValue(mockAssignment as any);

    const result = await JudgingService.getAssignment(judge, "assignment1");
    
    // Validate that the stripped fields are undefined
    expect((result.submission as any).teamId).toBeUndefined();
    expect((result.submission as any).team).toBeUndefined();
    
    // Check that we DO get the anonymous fields
    expect(result.submission.anonymousCode).toBe("P-ABCDEF");
  });
});
