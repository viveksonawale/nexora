import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { UpdateHackathonSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const hackathon = await HackathonService.getHackathonPublic(id, ctx.user);
  return NextResponse.json(hackathon);
});

export const PATCH = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const data = UpdateHackathonSchema.parse(body);

  const hackathon = await HackathonService.updateHackathon(ctx.user!, id, data);
  return NextResponse.json(hackathon);
});

export const DELETE = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  await HackathonService.cancelHackathon(ctx.user!, id); // Soft delete or cancel based on spec
  return new NextResponse(null, { status: 204 });
});
