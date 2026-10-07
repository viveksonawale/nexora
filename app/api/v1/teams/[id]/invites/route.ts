import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";
import { InviteMemberSchema } from "@/server/modules/team/team.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = InviteMemberSchema.parse(body);
  const invite = await TeamService.inviteMember(user!, id, data);
  return NextResponse.json(invite, { status: 201 });
});