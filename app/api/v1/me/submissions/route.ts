import { withApi, jsonResponse } from "@/server/lib/api";
import { getMySubmissions } from "@/server/modules/profile/profile.service";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await getMySubmissions(ctx.user!.id);
  return jsonResponse(result);
});
