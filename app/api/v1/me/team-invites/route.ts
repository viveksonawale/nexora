import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const GET = withApi({ auth: "user" }, async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const invites = await TeamService.getMyInvites(user!, all);
  return NextResponse.json(invites);
});
