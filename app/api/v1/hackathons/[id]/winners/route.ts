import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const winners = await HackathonService.getPublicWinners(id);
  return NextResponse.json(winners);
});
