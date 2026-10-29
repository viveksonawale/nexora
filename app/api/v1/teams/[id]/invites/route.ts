import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";
import { InviteMemberSchema } from "@/server/modules/team/team.schemas";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const rawId = ctx.params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId as string;
  const invites = await TeamService.getTeamInvitesForTeam(ctx.user!, id);
  return NextResponse.json(invites);
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const rawId = ctx.params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId as string;
  const body = await req.json().catch(() => ({}));
  const data = InviteMemberSchema.parse(body);
  const invite = await TeamService.inviteMember(ctx.user!, id, data);
  return NextResponse.json(invite, { status: 201 });
});
