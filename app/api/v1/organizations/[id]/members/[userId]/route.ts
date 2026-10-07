import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OrganizationService } from "@/server/modules/organization/organization.service";
import { UpdateMemberRoleSchema } from "@/server/modules/organization/organization.schemas";

export const PATCH = withApi({ auth: "user" }, async (req, { params, user }) => {
    const { id: orgId, userId: targetUserId } = params as Record<string, string>;
    const body = await req.json();
    const data = UpdateMemberRoleSchema.parse(body);

    const member = await OrganizationService.updateMemberRole(user!, orgId, targetUserId, data);
    return NextResponse.json(member);
  });

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
    const { id: orgId, userId: targetUserId } = params as Record<string, string>;
    await OrganizationService.removeMember(user!, orgId, targetUserId);
    return new NextResponse(null, { status: 204 });
  });
