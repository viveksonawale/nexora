import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OrganizationService } from "@/server/modules/organization/organization.service";
import { AddMemberSchema } from "@/server/modules/organization/organization.schemas";

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
    const { id: orgId } = params as Record<string, string>;
    const members = await OrganizationService.getOrganizationMembers(user!, orgId);
    return NextResponse.json(members);
  });

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
    const { id: orgId } = params as Record<string, string>;
    const body = await req.json();
    const data = AddMemberSchema.parse(body);

    const member = await OrganizationService.addMember(user!, orgId, data);
    return NextResponse.json(member, { status: 201 });
  });
