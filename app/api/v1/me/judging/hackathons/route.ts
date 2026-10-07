import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";

export const GET = withApi({ auth: "user" }, async (req, { user }) => {
  const result = await JudgingService.getMyJudgingHackathons(user!);
  return NextResponse.json(result);
});