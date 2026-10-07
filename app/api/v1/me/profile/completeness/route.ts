import { withApi, jsonResponse } from "@/server/lib/api";
import { getCompletenessScore } from "@/server/modules/profile/profile.service";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await getCompletenessScore(ctx.user!.id);
  return jsonResponse(result);
});
