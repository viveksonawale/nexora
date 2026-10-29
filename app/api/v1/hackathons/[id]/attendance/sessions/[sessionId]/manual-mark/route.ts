import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AttendanceService } from "@/server/modules/attendance/attendance.service";
import { z } from "zod";

const ManualMarkSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const sessionId = ctx.params?.sessionId as string;
  const body = await req.json();
  const { userId } = ManualMarkSchema.parse(body);

  const result = await AttendanceService.manualMark(
    ctx.user!,
    hackathonId,
    sessionId,
    userId
  );
  return NextResponse.json(result);
});
