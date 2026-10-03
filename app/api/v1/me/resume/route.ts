import { withApi, jsonResponse } from "@/server/lib/api";
import { getResumeData } from "@/server/modules/profile/profile.service";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await getResumeData(ctx.user!.id);
  return jsonResponse(result);
});
