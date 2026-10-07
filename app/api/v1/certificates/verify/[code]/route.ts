import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";

export const GET = withApi({ auth: "public" }, async (req, { params }) => {
  const { code } = params as Record<string, string>;
  const result = await CertificateService.verify(code);
  return NextResponse.json(result);
});