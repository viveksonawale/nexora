import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { OAuthService } from "@/server/modules/auth/oauth.service";
import { env } from "@/server/lib/env";

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const provider = ctx.params?.provider as string;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (provider !== "google") {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.redirect(`${env.APP_URL}/sign-in?error=oauth_failed`);
  }

  try {
    const { accessToken, refreshToken } = await OAuthService.handleGoogleCallback(code, req);

    const response = NextResponse.redirect(`${env.APP_URL}/hackathons`);

    response.cookies.set({
      name: "access_token",
      value: accessToken,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 mins
      path: "/",
    });

    response.cookies.set({
      name: "refresh_token",
      value: refreshToken,
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/api/v1/auth/refresh",
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${env.APP_URL}/sign-in?error=oauth_failed`);
  }
});
