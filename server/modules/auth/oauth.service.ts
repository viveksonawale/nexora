import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";
import { env } from "@/server/lib/env";
import {
  generateSecureToken,
  hashToken,
  signAccessToken,
} from "./tokens";
import { NextRequest, NextResponse } from "next/server";

export class OAuthService {
  static getGoogleAuthUrl() {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: env.GOOGLE_REDIRECT_URI as string,
      client_id: env.GOOGLE_CLIENT_ID as string,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };
    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  static async getGoogleUser(code: string) {
    const url = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: env.GOOGLE_CLIENT_ID as string,
      client_secret: env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: env.GOOGLE_REDIRECT_URI as string,
      grant_type: "authorization_code",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(values).toString(),
    });

    if (!res.ok) {
      throw AppError.unauthenticated("Failed to fetch Google OAuth Tokens");
    }

    const data = await res.json();
    const { id_token, access_token } = data;

    // Fetch Google User
    const googleUserRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );

    if (!googleUserRes.ok) {
      throw AppError.unauthenticated("Failed to fetch Google User");
    }

    return googleUserRes.json() as Promise<{
      id: string;
      email: string;
      verified_email: boolean;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      locale: string;
    }>;
  }

  static async handleGoogleCallback(code: string, req: NextRequest) {
    const googleUser = await this.getGoogleUser(code);

    if (!googleUser.verified_email) {
      throw AppError.businessRule("INVALID_STATE", "Google email is not verified.");
    }

    // 1. Find user by email
    let user = await db.user.findUnique({
      where: { email: googleUser.email },
      include: { profile: true },
    });

    // 2. If not found, create new user and profile
    if (!user) {
      const slug = googleUser.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();
      user = await db.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          emailVerifiedAt: new Date(),
          profile: {
            create: {
              avatarUrl: googleUser.picture,
              slug,
            },
          },
        },
        include: { profile: true },
      });
    } else {
      // Ensure email is verified if they login via OAuth for the first time on an existing account
      if (!user.emailVerifiedAt) {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      }
    }

    // 3. Create Session
    const userAgent = req.headers.get("user-agent") || "Unknown Device";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    const { token: refreshToken, hash: refreshTokenHash } = generateSecureToken();
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    const [session] = await db.$transaction([
      db.session.create({
        data: {
          userId: user.id,
          refreshTokenHash,
          userAgent,
          ipAddress: ip,
          expiresAt,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      platformRole: user.platformRole,
    });

    return { user, accessToken, refreshToken };
  }
}
