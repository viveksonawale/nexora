import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OrganizationService } from "@/server/modules/organization/organization.service";
import { UpdateOrganizationSchema } from "@/server/modules/organization/organization.schemas";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
    const slug = ctx.params?.id as string;
    const org = await OrganizationService.getOrganizationBySlug(slug);

    return NextResponse.json(org);
  });

export const PATCH = withApi({ auth: "user" }, async (req, ctx) => {
    const orgId = ctx.params?.id as string;
    const body = await req.json();
    const data = UpdateOrganizationSchema.parse(body);

    const org = await OrganizationService.updateOrganization(ctx.user!, orgId, data);

    return NextResponse.json(org);
  });
