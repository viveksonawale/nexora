import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { RegistrationService } from "@/server/modules/registration/registration.service";

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  await RegistrationService.undoCheckIn(user!, id);
  return new NextResponse(null, { status: 204 });
});
