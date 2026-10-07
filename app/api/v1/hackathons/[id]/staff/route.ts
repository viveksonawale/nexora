import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { StaffService } from "@/server/modules/staff/staff.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const staff = await StaffService.getStaffList(ctx.user!!, id);
  return NextResponse.json(staff);
});