import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { UpdatePlatformRoleSchema } from "@/server/modules/admin/admin.schemas";

export const POST = withApi({ auth: "superAdmin" }, async (req, { user, params }) => {
  const { id } = params as { id: string };
  const body = await req.json();
  const input = UpdatePlatformRoleSchema.parse(body);
  const result = await AdminService.updatePlatformRole(user!, id, input);
  return NextResponse.json(result);
});
