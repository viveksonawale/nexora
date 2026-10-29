import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";
import { RevokeCertificateSchema } from "@/server/modules/certificate/certificate.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const certId = ctx.params?.certId as string;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const data = RevokeCertificateSchema.parse(body);
  const result = await CertificateService.revoke(ctx.user!, hackathonId, certId, data.reason);
  return NextResponse.json(result);
});
