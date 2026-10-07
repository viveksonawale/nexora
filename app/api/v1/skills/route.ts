import { withApi, jsonResponse } from "@/server/lib/api";
import { searchSkills } from "@/server/modules/profile/profile.service";

export const GET = withApi({ auth: "public" }, async (req) => {
  const q = req.nextUrl.searchParams.get("q") || "";
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "15", 10)));
  const result = await searchSkills(q, limit);
  return jsonResponse(result);
});
