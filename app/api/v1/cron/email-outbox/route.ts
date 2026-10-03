import { withApi, jsonResponse } from "@/server/lib/api";
import { processOutboxBatch } from "@/server/modules/email/email.service";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";

export const POST = withApi({ auth: "public" }, async (req) => {
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
  const providedSecret = bearerSecret || cronHeader;

  if (providedSecret !== env.CRON_SECRET) {
    throw new AppError("FORBIDDEN", "Invalid cron secret", 403);
  }

  const result = await processOutboxBatch(25);
  return jsonResponse(result);
});

export const GET = POST;
