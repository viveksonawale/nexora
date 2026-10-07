import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const hackathon = await HackathonService.unpublishHackathon(user!, id);
  return NextResponse.json(hackathon);
});
