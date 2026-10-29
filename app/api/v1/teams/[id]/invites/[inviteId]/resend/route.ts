import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const rawInviteId = ctx.params?.inviteId;
  const inviteId = Array.isArray(rawInviteId) ? rawInviteId[0] : rawInviteId as string;

  const result = await TeamService.resendInvite(ctx.user!, inviteId);
  return NextResponse.json(result);
});

