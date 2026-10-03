import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id, userId: targetUserId } = params as Record<string, string>;
  await TeamService.removeMember(user!, id, targetUserId);
  return new NextResponse(null, { status: 204 });
});