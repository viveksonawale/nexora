import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { StaffService } from "@/server/modules/staff/staff.service";

export const DELETE = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const staffId = ctx.params?.staffId as string;
  await StaffService.removeStaff(ctx.user!!, id, staffId);
  return new NextResponse(null, { status: 204 });
});