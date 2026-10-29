import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { AdminRevokeRoleSchema } from "@/server/modules/admin/admin.schemas";

export const POST = withApi({ auth: "superAdmin" }, async (req, { user }) => {
  const body = await req.json();
  const input = AdminRevokeRoleSchema.parse(body);
  const result = await AdminService.revokeRole(user!, input);
  return NextResponse.json(result);
});
