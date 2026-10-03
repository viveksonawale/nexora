import { withApi, jsonResponse } from "@/server/lib/api";
import { updateExperience, deleteExperience } from "@/server/modules/profile/profile.service";
import { updateExperienceSchema } from "@/server/modules/profile/profile.schemas";
import { AppError } from "@/server/lib/errors";

export const PATCH = withApi({ auth: "user" }, async (req, ctx) => {
  const id = Array.isArray(ctx.params?.id) ? ctx.params.id[0] : ctx.params?.id;
  if (!id) throw new AppError("VALIDATION_FAILED", "Experience ID is required", 400);

  const body = await req.json();
  const input = updateExperienceSchema.parse(body);
  const result = await updateExperience(ctx.user!.id, id, input);
  return jsonResponse(result);
});

export const DELETE = withApi({ auth: "user" }, async (_req, ctx) => {
  const id = Array.isArray(ctx.params?.id) ? ctx.params.id[0] : ctx.params?.id;
  if (!id) throw new AppError("VALIDATION_FAILED", "Experience ID is required", 400);

  const result = await deleteExperience(ctx.user!.id, id);
  return jsonResponse(result);
});
