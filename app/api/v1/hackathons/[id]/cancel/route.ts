import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const hackathon = await HackathonService.cancelHackathon(ctx.user!!, id);
  return NextResponse.json(hackathon);
});
