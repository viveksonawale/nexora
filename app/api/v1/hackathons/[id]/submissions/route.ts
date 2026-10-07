import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const submissions = await SubmissionService.getHackathonSubmissions(ctx.user!, id);
  return NextResponse.json(submissions);
});
