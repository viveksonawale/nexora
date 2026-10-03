import { withApi, jsonResponse } from "@/server/lib/api";
import { resendVerificationEmail } from "@/server/modules/auth/auth.service";

export const POST = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await resendVerificationEmail(ctx.user!.id);
  return jsonResponse(result);
});
