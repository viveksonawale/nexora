import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const assignmentId = ctx.params?.assignmentId as string;
  const assignment = await JudgingService.getAssignment(ctx.user!, assignmentId);
  return NextResponse.json(assignment);
});
