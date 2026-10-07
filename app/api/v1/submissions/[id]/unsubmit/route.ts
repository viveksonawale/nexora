import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const submission = await SubmissionService.unsubmit(user!, id);
  return NextResponse.json(submission);
});