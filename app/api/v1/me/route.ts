import { withApi, jsonResponse } from "@/server/lib/api";
import { getMe, updateMe, deleteMe } from "@/server/modules/profile/profile.service";
import { updateMeSchema } from "@/server/modules/profile/profile.schemas";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await getMe(ctx.user!.id);
  return jsonResponse(result);
});

export const PATCH = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = updateMeSchema.parse(body);
  const result = await updateMe(ctx.user!.id, input);
  return jsonResponse(result);
});

export const DELETE = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await deleteMe(ctx.user!.id);
  return jsonResponse(result);
});
