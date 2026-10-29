import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const rawToken = ctx.params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!token) {
    return NextResponse.json({ valid: false, message: "Token is required" }, { status: 400 });
  }

  const result = await TeamService.getInviteByToken(ctx.user || null, token);
  return NextResponse.json(result);
});

