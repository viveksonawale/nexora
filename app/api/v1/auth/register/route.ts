import { withApi, jsonResponse } from "@/server/lib/api";
import { registerSchema } from "@/server/modules/auth/auth.schemas";
import { registerUser } from "@/server/modules/auth/auth.service";

export const POST = withApi({ auth: "public" }, async (req) => {
  const body = await req.json();
  const input = registerSchema.parse(body);

  const result = await registerUser(input);
  return jsonResponse(result, undefined, 201);
});
