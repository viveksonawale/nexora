import { describe, it, expect, vi } from "vitest";
import { SubmissionService } from "../server/modules/submission/submission.service";
import { db } from "../server/lib/db";
import { AuthUser } from "../server/policies/policy";
import { AppError } from "../server/lib/errors";

vi.mock("../server/lib/db", () => {
  return {
    db: {
      team: {
        findUnique: vi.fn(),
      },
      hackathon: {
        findUnique: vi.fn(),
      },
      submission: {
        findUnique: vi.fn(),
        update: vi.fn(),
      }
    }
  };
});

describe("Submission Service Rules", () => {
  it("After submissionDeadline, submission mutations are rejected", async () => {
    const user: AuthUser = { id: "u1", email: "user@example.com", role: "USER" };

    vi.mocked(db.submission.findUnique).mockResolvedValue({
      id: "sub1",
      hackathonId: "h1",
      team: {
        members: [{ registration: { userId: "u1" } }]
      }
    } as any);

    vi.mocked(db.hackathon.findUnique).mockResolvedValue({
      id: "h1",
      submissionDeadline: new Date(Date.now() - 86400000), // Past deadline
    } as any);

    await expect(SubmissionService.submit(user, "sub1")).rejects.toThrowError(
      new AppError("BUSINESS_RULE", "Submissions are locked after the deadline.")
    );
  });
});
