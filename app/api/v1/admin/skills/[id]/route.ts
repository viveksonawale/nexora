import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { UpdateSkillSchema } from "@/server/modules/admin/admin.schemas";

export const PATCH = withApi({ auth: "superAdmin" }, async (req, { params, user }) => {
    const { id } = params as Record<string, string>;
    const body = await req.json();
    const data = UpdateSkillSchema.parse(body);

    const skill = await AdminService.updateSkill(user!, id, data);
    return NextResponse.json(skill);
  });

export const DELETE = withApi({ auth: "superAdmin" }, async (req, { params, user }) => {
    const { id } = params as Record<string, string>;
    await AdminService.deleteSkill(user!, id);
    return new NextResponse(null, { status: 204 });
  });
