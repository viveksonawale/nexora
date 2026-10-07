import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OrganizationService } from "@/server/modules/organization/organization.service";
import { UpdateOrganizationSchema } from "@/server/modules/organization/organization.schemas";

export const GET = withApi({ auth: "public" }, async (req, { params }) => {
    // Treat params.id as the slug for the public GET route
    const { id: slug } = params as Record<string, string>;
    const org = await OrganizationService.getOrganizationBySlug(slug);

    return NextResponse.json(org);
  });

export const PATCH = withApi({ auth: "user" }, async (req, { params, user }) => {
    // For PATCH, params.id is the orgId
    const { id: orgId } = params as Record<string, string>;
    const body = await req.json();
    const data = UpdateOrganizationSchema.parse(body);

    const org = await OrganizationService.updateOrganization(user!, orgId, data);

    return NextResponse.json(org);
  });
