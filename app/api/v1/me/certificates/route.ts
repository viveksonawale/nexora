import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";

export const GET = withApi({ auth: "user" }, async (req, { user }) => {
  const result = await CertificateService.getMyCertificates(user!);
  return NextResponse.json(result);
});