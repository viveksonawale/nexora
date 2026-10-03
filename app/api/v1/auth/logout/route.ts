import { withApi, jsonResponse } from "@/server/lib/api";
import { logoutSession } from "@/server/modules/auth/auth.service";
import { clearAuthCookies } from "@/server/modules/auth/tokens";

export const POST = withApi({ auth: "user" }, async (req) => {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  await logoutSession(refreshToken);

  const response = jsonResponse({ message: "Logged out successfully" }, undefined, 200);
  clearAuthCookies(response);
  return response;
});
