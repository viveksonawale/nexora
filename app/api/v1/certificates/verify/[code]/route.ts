import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { CertificateService } from "@/server/modules/certificate/certificate.service";
import { checkVerifyRateLimit } from "@/server/lib/ratelimit";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const code = ctx.params?.code as string;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Dedicated verify rate limiter
  const rateLimitResult = await checkVerifyRateLimit(ip);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many verification requests. Please try again later.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
        },
      }
    );
  }

  const result = await CertificateService.verify(code);
  return NextResponse.json(result);
});
