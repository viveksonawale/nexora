import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { TeamService } from "@/server/modules/team/team.service";
import { TransferLeadershipSchema } from "@/server/modules/team/team.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = TransferLeadershipSchema.parse(body);
  const team = await TeamService.transferLeadership(user!, id, data);
  return NextResponse.json(team);
});