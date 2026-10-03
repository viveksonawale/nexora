import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OrganizationService } from "@/server/modules/organization/organization.service";

export const GET = withApi({ auth: "user" }, async (req, { user }) => {
    const orgs = await OrganizationService.getUserOrganizations(user!);
    return NextResponse.json(orgs);
  });
