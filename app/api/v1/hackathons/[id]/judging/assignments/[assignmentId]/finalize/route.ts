import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const assignmentId = ctx.params?.assignmentId as string;
  const result = await JudgingService.finalizeScores(ctx.user!, assignmentId);
  return NextResponse.json(result);
});
