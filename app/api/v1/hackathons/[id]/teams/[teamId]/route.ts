import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const rawTeamId = ctx.params?.teamId;
  const teamId = Array.isArray(rawTeamId) ? rawTeamId[0] : rawTeamId as string;
  const team = await TeamService.getTeam(ctx.user!, teamId);
  return NextResponse.json(team);
});

