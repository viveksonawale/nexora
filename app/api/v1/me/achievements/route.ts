import { withApi, jsonResponse } from "@/server/lib/api";
import { listAchievements, addAchievement } from "@/server/modules/profile/profile.service";
import { achievementSchema } from "@/server/modules/profile/profile.schemas";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await listAchievements(ctx.user!.id);
  return jsonResponse(result);
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = achievementSchema.parse(body);
  const result = await addAchievement(ctx.user!.id, input);
  return jsonResponse(result, undefined, 201);
});
