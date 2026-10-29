import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AttendanceSessionService } from "@/server/modules/attendance/attendance-session.service";
import { z } from "zod";

const UpdateSessionSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "ENDED"]),
  sessionId: z.string().optional(),
});

// GET current session status (public or authenticated participant)
export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const session = AttendanceSessionService.getSession(hackathonId);
  return NextResponse.json(session);
});

// POST update session status (Organizer / staff)
export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const body = await req.json();
  const data = UpdateSessionSchema.parse(body);

  const session = AttendanceSessionService.setSession(hackathonId, data.status, data.sessionId);
  return NextResponse.json(session);
});
