import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const rawToken = ctx.params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const result = await TeamService.declineInviteByToken(ctx.user!, token);
  return NextResponse.json(result);
});

