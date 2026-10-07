import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";
import { CreateTeamSchema, QueryTeamsSchema } from "@/server/modules/team/team.schemas";

export const POST = withApi({ auth: "verified" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = CreateTeamSchema.parse(body);
  const team = await TeamService.createTeam(user!, id, data);
  return NextResponse.json(team, { status: 201 });
});

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const { searchParams } = new URL(req.url);
  const query = QueryTeamsSchema.parse(Object.fromEntries(searchParams));
  const teams = await TeamService.getTeams(user!, id, query);
  return NextResponse.json(teams);
});