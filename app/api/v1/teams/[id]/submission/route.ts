import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";
import { UpsertSubmissionSchema } from "@/server/modules/submission/submission.schemas";

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const submission = await SubmissionService.getSubmissionByTeamId(user!, id);
  return NextResponse.json(submission || {});
});

export const PUT = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = UpsertSubmissionSchema.parse(body);
  const submission = await SubmissionService.upsertDraft(user!, id, data);
  return NextResponse.json(submission);
});