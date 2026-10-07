import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { StaffService } from "@/server/modules/staff/staff.service";

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id, staffId } = params as Record<string, string>;
  await StaffService.removeStaff(user!, id, staffId);
  return new NextResponse(null, { status: 204 });
});