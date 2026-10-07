import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";

export const PUT = withApi({ auth: "user" }, async (req, ctx) => {
  const assignmentId = ctx.params?.assignmentId as string;
  const body = await req.json();
  const result = await JudgingService.submitScores(ctx.user!, assignmentId, body);
  return NextResponse.json(result);
});
