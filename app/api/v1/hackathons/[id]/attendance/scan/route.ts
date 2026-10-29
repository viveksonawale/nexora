import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AttendanceService } from "@/server/modules/attendance/attendance.service";
import { z } from "zod";

const ScanSchema = z.object({
  token: z.string().min(1, "QR token is required"),
});

export const POST = withApi(
  {
    auth: "user",
    rateLimitKey: (req) => {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      return `scan:${ip}`;
    },
  },
  async (req, ctx) => {
    const hackathonId = ctx.params?.id as string;
    const body = await req.json();
    const { token } = ScanSchema.parse(body);

    const result = await AttendanceService.scanAttendanceToken(
      ctx.user!,
      hackathonId,
      token
    );
    return NextResponse.json(result);
  }
);
