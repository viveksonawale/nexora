import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";

export const GET = withApi({ auth: "supportAdmin" }, async (_req, { user }) => {
  const result = await AdminService.getRolesAndPermissions(user!);
  return NextResponse.json(result);
});
