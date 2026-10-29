import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { AdminCreateUserSchema } from "@/server/modules/admin/admin.schemas";

export const GET = withApi({ auth: "supportAdmin" }, async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const users = await AdminService.getUsers(user!, { q });
  return NextResponse.json(users);
});

export const POST = withApi({ auth: "superAdmin" }, async (req, { user }) => {
  const body = await req.json();
  const parsed = AdminCreateUserSchema.parse(body);
  const created = await AdminService.createUser(user!, parsed);
  return NextResponse.json(created, { status: 201 });
});

