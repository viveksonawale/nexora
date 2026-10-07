import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";
import { AwardPrizeSchema } from "@/server/modules/judging/judging.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const prizeId = ctx.params?.prizeId as string;
  const body = await req.json();
  const data = AwardPrizeSchema.parse(body);
  const result = await JudgingService.awardPrize(ctx.user!!, id, prizeId, data);
  return NextResponse.json(result);
});