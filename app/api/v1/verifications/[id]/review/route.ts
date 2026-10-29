import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { VerificationService } from "@/server/modules/verification/verification.service";
import { ReviewVerificationSchema } from "@/server/modules/verification/verification.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const input = ReviewVerificationSchema.parse(body);

  const result = await VerificationService.reviewRequest(ctx.user!, id, input);
  return NextResponse.json(result);
});
