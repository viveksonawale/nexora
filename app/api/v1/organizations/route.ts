import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OrganizationService } from "@/server/modules/organization/organization.service";
import { CreateOrganizationSchema } from "@/server/modules/organization/organization.schemas";

export const GET = withApi({ auth: "user" }, async (req, { user }) => {
  const orgs = await OrganizationService.getUserOrganizations(user!);
  return NextResponse.json(orgs);
});

export const POST = withApi({ auth: "verified" }, async (req, { user }) => {
    const body = await req.json();
    const data = CreateOrganizationSchema.parse(body);

    const org = await OrganizationService.createOrganization(user!, data);

    return NextResponse.json(org, { status: 201 });
  });
