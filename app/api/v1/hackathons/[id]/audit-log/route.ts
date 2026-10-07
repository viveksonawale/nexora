import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const auditLogs = await HackathonService.getHackathonAuditLog(user!, id);
  return NextResponse.json(auditLogs);
});
