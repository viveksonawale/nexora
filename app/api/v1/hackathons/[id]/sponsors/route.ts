import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { SponsorSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = SponsorSchema.parse(body);

  const result = await HackathonService.createSponsor(user!, id, data);
  return NextResponse.json(result, { status: 201 });
});
