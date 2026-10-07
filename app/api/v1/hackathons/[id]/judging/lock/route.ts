import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";
import { LockJudgingSchema } from "@/server/modules/judging/judging.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = Object.keys(await req.text() || {}).length ? await req.json() : {};
  const data = LockJudgingSchema.parse(body);
  const result = await JudgingService.lockJudging(ctx.user!!, id, data);
  return NextResponse.json(result);
});