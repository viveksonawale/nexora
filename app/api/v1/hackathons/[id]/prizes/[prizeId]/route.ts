import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { PrizeSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const PATCH = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const prizeId = ctx.params?.prizeId as string;
  const body = await req.json();
  const data = PrizeSchema.parse(body);

  const result = await HackathonService.updatePrize(ctx.user!!, id, prizeId, data);
  return NextResponse.json(result);
});

export const DELETE = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const prizeId = ctx.params?.prizeId as string;
  await HackathonService.deletePrize(ctx.user!!, id, prizeId);
  return new NextResponse(null, { status: 204 });
});
