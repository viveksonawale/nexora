import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";
import { IssueCertificatesSchema } from "@/server/modules/certificate/certificate.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = IssueCertificatesSchema.parse(body);
  const result = await CertificateService.issueBulk(user!, id, data);
  return NextResponse.json(result, { status: 201 });
});