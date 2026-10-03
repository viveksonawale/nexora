import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";
import { LockJudgingSchema } from "@/server/modules/judging/judging.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = Object.keys(await req.text() || {}).length ? await req.json() : {};
  const data = LockJudgingSchema.parse(body);
  const result = await JudgingService.lockJudging(user!, id, data);
  return NextResponse.json(result);
});