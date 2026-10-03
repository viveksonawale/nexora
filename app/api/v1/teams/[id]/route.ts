import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";
import { UpdateTeamSchema } from "@/server/modules/team/team.schemas";

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const team = await TeamService.getTeam(user!, id);
  return NextResponse.json(team);
});

export const PATCH = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = UpdateTeamSchema.parse(body);
  const team = await TeamService.updateTeam(user!, id, data);
  return NextResponse.json(team);
});

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  await TeamService.deleteTeam(user!, id);
  return new NextResponse(null, { status: 204 });
});