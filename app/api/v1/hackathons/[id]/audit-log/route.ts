import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const auditLogs = await HackathonService.getHackathonAuditLog(ctx.user!!, id);
  return NextResponse.json(auditLogs);
});
