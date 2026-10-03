import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";
import { JoinTeamSchema } from "@/server/modules/team/team.schemas";

export const POST = withApi({ auth: "verified" }, async (req, { user }) => {
  const body = await req.json();
  const data = JoinTeamSchema.parse(body);
  const member = await TeamService.joinWithCode(user!, data);
  return NextResponse.json(member, { status: 201 });
});