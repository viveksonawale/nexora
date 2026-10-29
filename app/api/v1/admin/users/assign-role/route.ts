import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { AdminAssignRoleSchema } from "@/server/modules/admin/admin.schemas";

export const POST = withApi({ auth: "superAdmin" }, async (req, { user }) => {
  const body = await req.json();
  const input = AdminAssignRoleSchema.parse(body);
  const result = await AdminService.assignRole(user!, input);
  return NextResponse.json(result);
});
