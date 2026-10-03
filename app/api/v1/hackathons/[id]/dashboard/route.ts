import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { DashboardService } from "@/server/modules/dashboard/dashboard.service";

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const result = await DashboardService.getHackathonDashboard(user!, id);
  return NextResponse.json(result);
});