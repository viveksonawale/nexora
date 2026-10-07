import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const result = await JudgingService.getAssignment(user!, id);
  return NextResponse.json(result);
});

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  await JudgingService.deleteAssignment(user!, id);
  return new NextResponse(null, { status: 204 });
});