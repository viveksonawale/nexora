import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { RegistrationService } from "@/server/modules/registration/registration.service";
import { BulkUpdateRegistrationStatusSchema } from "@/server/modules/registration/registration.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const data = BulkUpdateRegistrationStatusSchema.parse(body);

  const result = await RegistrationService.bulkUpdateStatus(ctx.user!!, id, data);
  return NextResponse.json(result);
});
