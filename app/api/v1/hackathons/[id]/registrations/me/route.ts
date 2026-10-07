import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { RegistrationService } from "@/server/modules/registration/registration.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const reg = await RegistrationService.getMyRegistration(ctx.user!!, id);
  return NextResponse.json(reg);
});

export const DELETE = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  await RegistrationService.withdraw(ctx.user!!, id);
  return new NextResponse(null, { status: 204 });
});
