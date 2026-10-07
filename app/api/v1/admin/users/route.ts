import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";

export const GET = withApi({ auth: "superAdmin" }, async (req, { user }) => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const users = await AdminService.getUsers(user!, { q });
    return NextResponse.json(users);
  });
