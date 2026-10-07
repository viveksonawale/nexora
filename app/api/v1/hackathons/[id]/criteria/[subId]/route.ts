import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { JudgingCriterionSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const PATCH = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const subId = ctx.params?.subId as string;
  const body = await req.json();
  const data = JudgingCriterionSchema.parse(body);

  const result = await HackathonService.updateCriterion(ctx.user!!, id, subId, data);
  return NextResponse.json(result);
});

export const DELETE = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const subId = ctx.params?.subId as string;
  await HackathonService.deleteCriterion(ctx.user!!, id, subId);
  return new NextResponse(null, { status: 204 });
});
