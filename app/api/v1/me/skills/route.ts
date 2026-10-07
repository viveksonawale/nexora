import { withApi, jsonResponse } from "@/server/lib/api";
import { updateSkills } from "@/server/modules/profile/profile.service";
import { skillsSchema } from "@/server/modules/profile/profile.schemas";

export const PUT = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = skillsSchema.parse(body);
  const result = await updateSkills(ctx.user!.id, input.skills);
  return jsonResponse(result);
});
