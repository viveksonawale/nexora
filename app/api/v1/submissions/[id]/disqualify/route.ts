import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";
import { DisqualifySchema } from "@/server/modules/submission/submission.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = DisqualifySchema.parse(body);
  const submission = await SubmissionService.disqualify(user!, id, data);
  return NextResponse.json(submission);
});
