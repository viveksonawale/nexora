import { withApi, jsonResponse } from "@/server/lib/api";
import { listProjects, addProject } from "@/server/modules/profile/profile.service";
import { projectSchema } from "@/server/modules/profile/profile.schemas";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const result = await listProjects(ctx.user!.id);
  return jsonResponse(result);
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = projectSchema.parse(body);
  const result = await addProject(ctx.user!.id, input);
  return jsonResponse(result, undefined, 201);
});
