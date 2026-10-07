import { withApi, jsonResponse } from "@/server/lib/api";
import { refreshSession } from "@/server/modules/auth/auth.service";
import { setAuthCookies } from "@/server/modules/auth/tokens";
import { AppError } from "@/server/lib/errors";

export const POST = withApi({ auth: "public" }, async (req, ctx) => {
  let refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    try {
      const body = await req.json();
      refreshToken = body?.refreshToken;
    } catch {
      // Body not provided or not JSON
    }
  }

  if (!refreshToken) {
    throw new AppError("UNAUTHENTICATED", "No refresh token provided", 401);
  }

  const result = await refreshSession({
    refreshToken,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const response = jsonResponse(
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    undefined,
    200
  );

  setAuthCookies(response, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return response;
});
