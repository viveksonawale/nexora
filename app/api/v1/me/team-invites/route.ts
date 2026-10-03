import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const GET = withApi({ auth: "user" }, async (req, { user }) => {
  const invites = await TeamService.getMyInvites(user!);
  return NextResponse.json(invites);
});