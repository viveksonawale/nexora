import { withApi, jsonResponse } from "@/server/lib/api";
import { getPublicProfile } from "@/server/modules/profile/profile.service";
import { AppError } from "@/server/lib/errors";

export const GET = withApi({ auth: "public" }, async (_req, ctx) => {
  const slug = Array.isArray(ctx.params?.slug) ? ctx.params.slug[0] : ctx.params?.slug;
  if (!slug) throw new AppError("VALIDATION_FAILED", "Profile slug is required", 400);

  const result = await getPublicProfile(slug);
  return jsonResponse(result);
});
