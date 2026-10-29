import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";

export const GET = withApi({ auth: "user" }, async (req, ctx) => {
  const hackathonId = ctx.params?.id as string;
  const result = await CertificateService.downloadAllZip(ctx.user!, hackathonId);

  return new NextResponse(new Uint8Array(result.zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": result.zipBuffer.length.toString(),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
});
