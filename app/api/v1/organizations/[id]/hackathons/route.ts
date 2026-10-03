import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { CreateHackathonSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id: orgId } = params as Record<string, string>;
  const hackathons = await HackathonService.getOrganizationHackathons(user!, orgId);
  return NextResponse.json(hackathons);
});

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id: orgId } = params as Record<string, string>;
  const body = await req.json();
  const data = CreateHackathonSchema.parse(body);

  const hackathon = await HackathonService.createHackathon(user!, orgId, data);
  return NextResponse.json(hackathon, { status: 201 });
});
