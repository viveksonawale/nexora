import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";

export const POST = withApi({ auth: "superAdmin" }, async (req, { params, user }) => {
    const { id } = params as Record<string, string>;
    const result = await AdminService.suspendUser(user!, id);
    return NextResponse.json(result);
  });
