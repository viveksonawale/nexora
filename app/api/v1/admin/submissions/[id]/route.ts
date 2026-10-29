import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";

export const DELETE = withApi({ auth: "superAdmin" }, async (_req, ctx) => {
  const id = ctx.params?.id as string;
  const res = await AdminService.deleteSubmission(ctx.user!, id);
  return NextResponse.json(res);
});

