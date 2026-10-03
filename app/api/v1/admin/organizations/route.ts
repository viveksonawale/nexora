import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";

export const GET = withApi({ auth: "superAdmin" }, async (req, { user }) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const orgs = await AdminService.getOrganizations(user!, { status });
    return NextResponse.json(orgs);
  });
