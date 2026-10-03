import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { UpdateHackathonSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const GET = withApi({ auth: "public" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const hackathon = await HackathonService.getHackathonPublic(id, user);
  return NextResponse.json(hackathon);
});

export const PATCH = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = UpdateHackathonSchema.parse(body);

  const hackathon = await HackathonService.updateHackathon(user!, id, data);
  return NextResponse.json(hackathon);
});

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  await HackathonService.cancelHackathon(user!, id); // Soft delete or cancel based on spec
  return new NextResponse(null, { status: 204 });
});
