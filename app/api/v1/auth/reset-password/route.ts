import { withApi, jsonResponse } from "@/server/lib/api";
import { resetPasswordSchema } from "@/server/modules/auth/auth.schemas";
import { resetPasswordWithToken } from "@/server/modules/auth/auth.service";
import { clearAuthCookies } from "@/server/modules/auth/tokens";

export const POST = withApi({ auth: "public" }, async (req) => {
  const body = await req.json();
  const input = resetPasswordSchema.parse(body);

  const result = await resetPasswordWithToken(input);
  const response = jsonResponse(result);
  clearAuthCookies(response);
  return response;
});
