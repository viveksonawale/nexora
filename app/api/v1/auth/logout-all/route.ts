import { withApi, jsonResponse } from "@/server/lib/api";
import { logoutAllSessions } from "@/server/modules/auth/auth.service";
import { clearAuthCookies } from "@/server/modules/auth/tokens";

export const POST = withApi({ auth: "user" }, async (_req, ctx) => {
  await logoutAllSessions(ctx.user!.id);

  const response = jsonResponse({ message: "All sessions revoked successfully" }, undefined, 200);
  clearAuthCookies(response);
  return response;
});
