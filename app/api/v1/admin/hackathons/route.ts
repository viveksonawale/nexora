import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { AdminCreateHackathonSchema } from "@/server/modules/admin/admin.schemas";

export const GET = withApi({ auth: "supportAdmin" }, async (_req, { user }) => {
  const data = await AdminService.getAdminHackathons(user!);
  return NextResponse.json(data);
});

export const POST = withApi({ auth: "superAdmin" }, async (req, { user }) => {
  const body = await req.json();
  const parsed = AdminCreateHackathonSchema.parse(body);
  const created = await AdminService.createHackathon(user!, parsed);
  return NextResponse.json(created, { status: 201 });
});


