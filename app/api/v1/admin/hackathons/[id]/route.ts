import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { AdminUpdateHackathonSchema } from "@/server/modules/admin/admin.schemas";

export const PATCH = withApi({ auth: "superAdmin" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const parsed = AdminUpdateHackathonSchema.parse(body);
  const updated = await AdminService.updateHackathon(ctx.user!, id, parsed);
  return NextResponse.json(updated);
});

export const DELETE = withApi({ auth: "superAdmin" }, async (_req, ctx) => {
  const id = ctx.params?.id as string;
  const res = await AdminService.deleteHackathon(ctx.user!, id);
  return NextResponse.json(res);
});

