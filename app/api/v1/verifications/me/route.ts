import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { VerificationService } from "@/server/modules/verification/verification.service";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const status = await VerificationService.getMyStatus(ctx.user!);
  return NextResponse.json(status);
});
