import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { SubmissionService } from "@/server/modules/submission/submission.service";
import { AddMediaSchema } from "@/server/modules/submission/submission.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = AddMediaSchema.parse(body);
  const media = await SubmissionService.addMedia(user!, id, data);
  return NextResponse.json(media, { status: 201 });
});