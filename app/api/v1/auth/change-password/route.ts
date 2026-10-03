import { withApi, jsonResponse } from "@/server/lib/api";
import { changePasswordSchema } from "@/server/modules/auth/auth.schemas";
import { changePassword } from "@/server/modules/auth/auth.service";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = changePasswordSchema.parse(body);

  const result = await changePassword(ctx.user!.id, input);
  return jsonResponse(result);
});
