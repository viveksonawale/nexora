import { withApi, jsonResponse } from "@/server/lib/api";
import { loginSchema } from "@/server/modules/auth/auth.schemas";
import { loginUser } from "@/server/modules/auth/auth.service";
import { setAuthCookies } from "@/server/modules/auth/tokens";

export const POST = withApi({ auth: "public" }, async (req, ctx) => {
  const body = await req.json();
  const input = loginSchema.parse(body);

  const result = await loginUser({
    ...input,
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
