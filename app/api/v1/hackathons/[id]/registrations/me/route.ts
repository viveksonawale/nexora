import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { RegistrationService } from "@/server/modules/registration/registration.service";

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const reg = await RegistrationService.getMyRegistration(user!, id);
  return NextResponse.json(reg);
});

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  await RegistrationService.withdraw(user!, id);
  return new NextResponse(null, { status: 204 });
});
