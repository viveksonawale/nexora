import { withApi, jsonResponse } from "@/server/lib/api";
import { updateAchievement, deleteAchievement } from "@/server/modules/profile/profile.service";
import { updateAchievementSchema } from "@/server/modules/profile/profile.schemas";
import { AppError } from "@/server/lib/errors";

export const PATCH = withApi({ auth: "user" }, async (req, ctx) => {
  const id = Array.isArray(ctx.params?.id) ? ctx.params.id[0] : ctx.params?.id;
  if (!id) throw new AppError("VALIDATION_FAILED", "Achievement ID is required", 400);

  const body = await req.json();
  const input = updateAchievementSchema.parse(body);
  const result = await updateAchievement(ctx.user!.id, id, input);
  return jsonResponse(result);
});

export const DELETE = withApi({ auth: "user" }, async (_req, ctx) => {
  const id = Array.isArray(ctx.params?.id) ? ctx.params.id[0] : ctx.params?.id;
  if (!id) throw new AppError("VALIDATION_FAILED", "Achievement ID is required", 400);

  const result = await deleteAchievement(ctx.user!.id, id);
  return jsonResponse(result);
});
