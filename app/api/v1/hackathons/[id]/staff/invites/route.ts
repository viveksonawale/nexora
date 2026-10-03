import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { StaffService } from "@/server/modules/staff/staff.service";
import { InviteStaffSchema } from "@/server/modules/staff/staff.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = InviteStaffSchema.parse(body);
  const result = await StaffService.invite(user!, id, data);
  return NextResponse.json(result, { status: 201 });
});