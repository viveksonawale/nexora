import { withApi, jsonResponse } from "@/server/lib/api";
import { listEducation, addEducation } from "@/server/modules/profile/profile.service";
import { educationSchema } from "@/server/modules/profile/profile.schemas";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await listEducation(ctx.user!.id);
  return jsonResponse(result);
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = educationSchema.parse(body);
  const result = await addEducation(ctx.user!.id, input);
  return jsonResponse(result, undefined, 201);
});
