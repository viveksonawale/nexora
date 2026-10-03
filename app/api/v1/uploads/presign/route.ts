import { withApi, jsonResponse } from "@/server/lib/api";
import { presignUpload } from "@/server/modules/uploads/uploads.service";
import { presignUploadSchema } from "@/server/modules/uploads/uploads.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = presignUploadSchema.parse(body);
  const result = await presignUpload(ctx.user!.id, input);
  return jsonResponse(result, undefined, 201);
});
