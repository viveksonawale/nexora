import { describe, it, expect, vi } from "vitest";
import { TeamService } from "../server/modules/team/team.service";
import { db } from "../server/lib/db";
import { AuthUser } from "../server/policies/policy";
import { AppError } from "../server/lib/errors";

vi.mock("../server/lib/db", () => {
  return {
    db: {
      team: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      registration: {
        findUnique: vi.fn(),
      },
      teamMember: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      hackathon: {
        findUnique: vi.fn(),
      }
    }
  };
});

describe("Team Service Rules", () => {
  it("A participant cannot join two teams in the same hackathon", async () => {
    const user: AuthUser = { id: "u1", email: "test@example.com", role: "USER" };
    
    vi.mocked(db.team.findUnique).mockResolvedValue({
      id: "team1",
      hackathonId: "h1",
      leaderId: "l1",
      inviteCode: "CODE123",
      lookingForMembers: false,
    } as any);

    vi.mocked(db.hackathon.findUnique).mockResolvedValue({
      id: "h1",
      maxTeamSize: 4,
      submissionDeadline: new Date(Date.now() + 86400000), // Future
    } as any);

    vi.mocked(db.registration.findUnique).mockResolvedValue({
      id: "reg1",
      status: "APPROVED",
      teamMember: { id: "tm1", teamId: "some-other-team" } // Already in a team
    } as any);

    await expect(TeamService.joinWithCode(user, { code: "CODE123" })).rejects.toThrowError(
      new AppError("BUSINESS_RULE", "You are already in a team.")
    );
  });

  it("After submissionDeadline, team mutations are rejected", async () => {
    const user: AuthUser = { id: "u1", email: "test@example.com", role: "USER" };
    
    vi.mocked(db.team.findUnique).mockResolvedValue({
      id: "team1",
      hackathonId: "h1",
      leaderId: "l1",
    } as any);

    vi.mocked(db.hackathon.findUnique).mockResolvedValue({
      id: "h1",
      maxTeamSize: 4,
      submissionDeadline: new Date(Date.now() - 86400000), // Past
    } as any);

    await expect(TeamService.joinWithCode(user, { code: "CODE123" })).rejects.toThrowError(
      new AppError("BUSINESS_RULE", "Team modifications are locked after the submission deadline.")
    );
  });
});
