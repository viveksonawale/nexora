import { withApi, jsonResponse } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";

export const GET = withApi({ auth: "user" }, async (req, { user }) => {
  const result = await CertificateService.getMyCertificates(user!);
  return jsonResponse(result);
});