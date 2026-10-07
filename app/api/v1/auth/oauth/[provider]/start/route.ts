import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OAuthService } from "@/server/modules/auth/oauth.service";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const provider = ctx.params?.provider as string;

  if (provider === "google") {
    const url = OAuthService.getGoogleAuthUrl();
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
});
