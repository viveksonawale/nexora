import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id, mediaId } = params as Record<string, string>;
  await SubmissionService.removeMedia(user!, id, mediaId);
  return new NextResponse(null, { status: 204 });
});