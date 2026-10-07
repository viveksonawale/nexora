import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";

export const GET = withApi({ auth: "superAdmin" }, async (req, { user }) => {
    const logs = await AdminService.getAuditLogs(user!);
    return NextResponse.json(logs);
  });
