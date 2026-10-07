import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { StaffService } from "@/server/modules/staff/staff.service";
import { ProcessStaffInviteSchema } from "@/server/modules/staff/staff.schemas";

export const POST = withApi({ auth: "user" }, async (req, { user }) => {
  const body = await req.json();
  const data = ProcessStaffInviteSchema.parse(body);
  const result = await StaffService.decline(user!, data);
  return NextResponse.json(result);
});