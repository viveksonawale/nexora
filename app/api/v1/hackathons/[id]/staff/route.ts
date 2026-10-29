import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { StaffService } from "@/server/modules/staff/staff.service";
import { AssignStaffDirectSchema } from "@/server/modules/staff/staff.schemas";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const id = ctx.params?.id as string;
  const staff = await StaffService.getStaffList(ctx.user!, id);
  return NextResponse.json(staff);
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const data = AssignStaffDirectSchema.parse(body);
  const result = await StaffService.assignDirect(ctx.user!, id, data);
  return NextResponse.json(result, { status: 201 });
});
