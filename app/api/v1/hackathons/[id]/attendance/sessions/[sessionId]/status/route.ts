import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AttendanceService } from "@/server/modules/attendance/attendance.service";
import { SessionStatus } from "@prisma/client";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.nativeEnum(SessionStatus),
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const sessionId = ctx.params?.sessionId as string;
  const body = await req.json();
  const { status } = StatusSchema.parse(body);

  const updated = await AttendanceService.updateSessionStatus(
    ctx.user!,
    hackathonId,
    sessionId,
    status
  );
  return NextResponse.json(updated);
});
