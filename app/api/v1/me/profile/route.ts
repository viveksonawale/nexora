import { withApi, jsonResponse } from "@/server/lib/api";
import { getFullProfile, updateProfileBasics } from "@/server/modules/profile/profile.service";
import { updateProfileSchema } from "@/server/modules/profile/profile.schemas";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await getFullProfile(ctx.user!.id);
  return jsonResponse(result);
});

export const PUT = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = updateProfileSchema.parse(body);
  const result = await updateProfileBasics(ctx.user!.id, input);
  return jsonResponse(result);
});
