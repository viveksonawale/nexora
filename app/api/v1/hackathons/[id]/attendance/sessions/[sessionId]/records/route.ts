import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AttendanceService } from "@/server/modules/attendance/attendance.service";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const sessionId = ctx.params?.sessionId as string;

  const result = await AttendanceService.listAttendance(
    ctx.user!,
    hackathonId,
    sessionId
  );
  return NextResponse.json(result);
});
