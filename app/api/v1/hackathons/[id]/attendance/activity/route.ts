import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AttendanceSessionService } from "@/server/modules/attendance/attendance-session.service";

// GET recent check-in activities for this hackathon
export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const activities = await AttendanceSessionService.getRecentCheckIns(hackathonId);
  return NextResponse.json({ activities });
});
