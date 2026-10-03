import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { RegistrationService } from "@/server/modules/registration/registration.service";
import { BulkUpdateRegistrationStatusSchema } from "@/server/modules/registration/registration.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = BulkUpdateRegistrationStatusSchema.parse(body);

  const result = await RegistrationService.bulkUpdateStatus(user!, id, data);
  return NextResponse.json(result);
});
