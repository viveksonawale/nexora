import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const result = await CertificateService.downloadCertificate(ctx.user!, id);

  return new NextResponse(new Uint8Array(result.pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": result.pdfBuffer.length.toString(),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
});
