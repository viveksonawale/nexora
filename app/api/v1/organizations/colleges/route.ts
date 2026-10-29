import { NextResponse } from "next/server";
import { db } from "@/server/lib/db";
import { OrganizationStatus, OrganizationType } from "@prisma/client";

export async function GET() {
  const colleges = await db.organization.findMany({
    where: {
      status: OrganizationStatus.ACTIVE,
      type: OrganizationType.COLLEGE,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      logoUrl: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(colleges);
}
