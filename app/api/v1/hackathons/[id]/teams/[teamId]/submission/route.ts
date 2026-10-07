import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const teamId = ctx.params?.teamId as string;
  const sub = await SubmissionService.getSubmissionByTeamId(ctx.user!, teamId);
  return NextResponse.json(sub || { status: "NEW" }); // return something so frontend doesn't crash on null
});

export const PUT = withApi({ auth: "user" }, async (req, ctx) => {
  const teamId = ctx.params?.teamId as string;
  const body = await req.json();
  const sub = await SubmissionService.upsertDraft(ctx.user!, teamId, body);
  return NextResponse.json(sub);
});
