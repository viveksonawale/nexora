import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const teamId = ctx.params?.teamId as string;
  // first get the submission to get its ID
  const sub = await SubmissionService.getSubmissionByTeamId(ctx.user!, teamId);
  if (!sub) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const result = await SubmissionService.submit(ctx.user!, sub.id);
  return NextResponse.json(result);
});
