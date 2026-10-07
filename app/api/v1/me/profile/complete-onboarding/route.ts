import { withApi, jsonResponse } from "@/server/lib/api";
import { completeOnboarding } from "@/server/modules/profile/profile.service";

export const POST = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await completeOnboarding(ctx.user!.id);
  return jsonResponse(result);
});
