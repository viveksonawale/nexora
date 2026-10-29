import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const teams = await TeamService.getMyTeams(ctx.user!);
  return NextResponse.json(teams);
});

