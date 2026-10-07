import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { DashboardService } from "@/server/modules/dashboard/dashboard.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const result = await DashboardService.getHackathonDashboard(ctx.user!!, id);
  return NextResponse.json(result);
});