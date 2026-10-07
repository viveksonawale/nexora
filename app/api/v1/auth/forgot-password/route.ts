import { withApi, emptyResponse } from "@/server/lib/api";
import { forgotPasswordSchema } from "@/server/modules/auth/auth.schemas";
import { forgotPassword } from "@/server/modules/auth/auth.service";

export const POST = withApi({ auth: "public" }, async (req) => {
  const body = await req.json();
  const { email } = forgotPasswordSchema.parse(body);

  await forgotPassword(email);
  return emptyResponse(204);
});
