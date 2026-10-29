import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OAuthService } from "@/server/modules/auth/oauth.service";
import { setAuthCookies } from "@/server/modules/auth/tokens";
import { env } from "@/server/lib/env";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const provider = ctx.params?.provider as string;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (provider !== "google") {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.redirect(`${env.APP_URL}/?auth=login&error=oauth_failed`);
  }

  try {
    const { accessToken, refreshToken } = await OAuthService.handleGoogleCallback(code, req);

    const response = NextResponse.redirect(`${env.APP_URL}/hackathons`);

    setAuthCookies(response, {
      accessToken,
      refreshToken,
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${env.APP_URL}/?auth=login&error=oauth_failed`);
  }
});
