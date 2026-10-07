import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { QueryHackathonSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const GET = withApi({ auth: "public" }, async (req) => {
  const { searchParams } = new URL(req.url);
  const query = QueryHackathonSchema.parse(Object.fromEntries(searchParams));

  const hackathons = await HackathonService.getHackathons(query);
  return NextResponse.json(hackathons);
});
