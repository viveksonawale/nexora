import { withApi, jsonResponse } from "@/server/lib/api";
import { confirmUpload } from "@/server/modules/uploads/uploads.service";
import { AppError } from "@/server/lib/errors";

export const POST = withApi({ auth: "user" }, async (_req, ctx) => {
  const id = Array.isArray(ctx.params?.id) ? ctx.params.id[0] : ctx.params?.id;
  if (!id) throw new AppError("VALIDATION_FAILED", "File ID is required", 400);

  const result = await confirmUpload(ctx.user!.id, id);
  return jsonResponse(result);
});
