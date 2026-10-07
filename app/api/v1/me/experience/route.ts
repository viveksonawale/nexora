import { withApi, jsonResponse } from "@/server/lib/api";
import { listExperience, addExperience } from "@/server/modules/profile/profile.service";
import { experienceSchema } from "@/server/modules/profile/profile.schemas";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await listExperience(ctx.user!.id);
  return jsonResponse(result);
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = experienceSchema.parse(body);
  const result = await addExperience(ctx.user!.id, input);
  return jsonResponse(result, undefined, 201);
});
