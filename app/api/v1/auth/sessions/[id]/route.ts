import { withApi, jsonResponse } from "@/server/lib/api";
import { revokeUserSession } from "@/server/modules/auth/auth.service";
import { AppError } from "@/server/lib/errors";

export const DELETE = withApi({ auth: "user" }, async (_req, ctx) => {
  const sessionId = Array.isArray(ctx.params?.id) ? ctx.params.id[0] : ctx.params?.id;
  if (!sessionId) {
    throw new AppError("VALIDATION_FAILED", "Session ID is required", 400);
  }
  const result = await revokeUserSession(ctx.user!.id, sessionId);
  return jsonResponse(result);
});
