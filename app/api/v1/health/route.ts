import { withApi, jsonResponse } from "@/server/lib/api";
import { db } from "@/server/lib/db";

export const GET = withApi(async () => {
  // Check database connectivity
  await db.$queryRaw`SELECT 1`;

  return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
});
