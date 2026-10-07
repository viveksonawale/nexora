import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { JudgingService } from "@/server/modules/judging/judging.service";
import { AwardPrizeSchema } from "@/server/modules/judging/judging.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id, prizeId } = params as Record<string, string>;
  const body = await req.json();
  const data = AwardPrizeSchema.parse(body);
  const result = await JudgingService.awardPrize(user!, id, prizeId, data);
  return NextResponse.json(result);
});