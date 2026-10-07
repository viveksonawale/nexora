import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const project = await SubmissionService.getPublicProject(id);
  return NextResponse.json(project);
});
