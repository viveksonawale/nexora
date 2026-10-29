import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { VerificationService } from "@/server/modules/verification/verification.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId") || undefined;

  const queue = await VerificationService.getPendingRequestsForReviewer(ctx.user!, orgId);
  return NextResponse.json(queue);
});
