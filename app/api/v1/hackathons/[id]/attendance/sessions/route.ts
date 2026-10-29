import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AttendanceService } from "@/server/modules/attendance/attendance.service";
import { z } from "zod";

const StartSessionSchema = z.object({
  title: z.string().optional(),
});

// GET active or latest session for this hackathon
export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const session = await AttendanceService.getActiveSession(hackathonId);
  return NextResponse.json(session);
});

// POST start new attendance session (Allowed only while hackathon is LIVE)
export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const body = await req.json().catch(() => ({}));
  const data = StartSessionSchema.parse(body);

  const result = await AttendanceService.startSession(ctx.user!, hackathonId, data.title);
  return NextResponse.json(result, { status: 201 });
});
