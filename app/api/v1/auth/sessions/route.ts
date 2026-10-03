import { withApi, jsonResponse } from "@/server/lib/api";
import { getUserSessions } from "@/server/modules/auth/auth.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const currentToken = req.cookies.get("refresh_token")?.value;
  const sessions = await getUserSessions(ctx.user!.id, currentToken);
  return jsonResponse(sessions);
});
