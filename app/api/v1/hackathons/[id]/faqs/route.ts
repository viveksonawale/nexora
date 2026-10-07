import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { FaqSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const data = FaqSchema.parse(body);

  const result = await HackathonService.createFaq(ctx.user!!, id, data);
  return NextResponse.json(result, { status: 201 });
});
