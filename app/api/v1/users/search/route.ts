import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const GET = withApi({ auth: "user" }, async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const hackathonId = searchParams.get("hackathonId") || undefined;

  const users = await TeamService.searchCandidateUsers(user!, hackathonId, q);
  return NextResponse.json(users);
});

