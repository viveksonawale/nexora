import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { RegistrationService } from "@/server/modules/registration/registration.service";
import { CheckInSchema } from "@/server/modules/registration/registration.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = CheckInSchema.parse(body);

  const reg = await RegistrationService.checkIn(user!, id, data);
  return NextResponse.json(reg);
});
