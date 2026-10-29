import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { AdminUpdateUserSchema } from "@/server/modules/admin/admin.schemas";

export const PATCH = withApi({ auth: "superAdmin" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const parsed = AdminUpdateUserSchema.parse(body);
  const updated = await AdminService.updateUser(ctx.user!, id, parsed);
  return NextResponse.json(updated);
});

export const DELETE = withApi({ auth: "superAdmin" }, async (_req, ctx) => {
  const id = ctx.params?.id as string;
  const res = await AdminService.deleteUser(ctx.user!, id);
  return NextResponse.json(res);
});

