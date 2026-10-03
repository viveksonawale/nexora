import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AdminService } from "@/server/modules/admin/admin.service";
import { CreateSkillSchema } from "@/server/modules/admin/admin.schemas";

export const GET = withApi({ auth: "superAdmin" }, async (req, { user }) => {
    const skills = await AdminService.getSkills(user!);
    return NextResponse.json(skills);
  });

export const POST = withApi({ auth: "superAdmin" }, async (req, { user }) => {
    const body = await req.json();
    const data = CreateSkillSchema.parse(body);

    const skill = await AdminService.createSkill(user!, data);
    return NextResponse.json(skill, { status: 201 });
  });
