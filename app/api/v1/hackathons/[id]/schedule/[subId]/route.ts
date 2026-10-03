import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { ScheduleItemSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const PATCH = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id, subId } = params as Record<string, string>;
  const body = await req.json();
  const data = ScheduleItemSchema.parse(body);

  const result = await HackathonService.updateSchedule(user!, id, subId, data);
  return NextResponse.json(result);
});

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id, subId } = params as Record<string, string>;
  await HackathonService.deleteSchedule(user!, id, subId);
  return new NextResponse(null, { status: 204 });
});
