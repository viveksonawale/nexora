import { withApi, jsonResponse } from "@/server/lib/api";
import { verifyEmailSchema } from "@/server/modules/auth/auth.schemas";
import { verifyEmailToken } from "@/server/modules/auth/auth.service";

export const POST = withApi({ auth: "public" }, async (req) => {
  const body = await req.json();
  const { token } = verifyEmailSchema.parse(body);

  const result = await verifyEmailToken(token);
  return jsonResponse(result);
});
