import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { VerificationService } from "@/server/modules/verification/verification.service";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const id = ctx.params?.id as string;
  const result = await VerificationService.getSignedIdCardUrl(ctx.user!, id);
  return NextResponse.json(result);
});
