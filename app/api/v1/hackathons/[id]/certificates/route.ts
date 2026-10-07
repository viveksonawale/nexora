import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const result = await CertificateService.getHackathonCertificates(ctx.user!!, id);
  return NextResponse.json(result);
});