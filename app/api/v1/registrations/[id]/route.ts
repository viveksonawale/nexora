import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { RegistrationService } from "@/server/modules/registration/registration.service";
import { UpdateRegistrationStatusSchema } from "@/server/modules/registration/registration.schemas";

export const PATCH = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = UpdateRegistrationStatusSchema.parse(body);

  const reg = await RegistrationService.updateStatus(user!, id, data);
  return NextResponse.json(reg);
});
