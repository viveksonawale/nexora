import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AttendanceService } from "@/server/modules/attendance/attendance.service";
import { AppError } from "@/server/lib/errors";

// Verify access to projector display page (requires organizer auth, constant-time compare)
export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const rawKey = ctx.params?.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (!key) throw AppError.badRequest("Display key is required");

  const data = await AttendanceService.verifyDisplayAccess(ctx.user, key);
  return NextResponse.json(data);
});
