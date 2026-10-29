import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { DashboardService } from "@/server/modules/dashboard/dashboard.service";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await DashboardService.getStudentDashboard(ctx.user!);
  return NextResponse.json(result);
});

