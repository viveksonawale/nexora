import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { VerificationService } from "@/server/modules/verification/verification.service";
import { SubmitVerificationSchema } from "@/server/modules/verification/verification.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const body = await req.json();
  const input = SubmitVerificationSchema.parse(body);

  const result = await VerificationService.submitRequest(ctx.user!, input);
  return NextResponse.json(result, { status: 201 });
});
