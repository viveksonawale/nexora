import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";
import { ManualAssignJudgeSchema } from "@/server/modules/judging/judging.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = ManualAssignJudgeSchema.parse(body);
  const result = await JudgingService.manualAssign(user!, id, data);
  return NextResponse.json(result, { status: 201 });
});