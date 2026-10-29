import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";

export const GET = withApi({ auth: "superAdmin" }, async (_req, { user }) => {
  const data = await AdminService.getDashboardStats(user!);
  return NextResponse.json(data);
});

