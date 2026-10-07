import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";
import { PlatformRole } from "@prisma/client";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  platformRole: PlatformRole;
}

const secretKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_SECONDS}s`)
    .sign(secretKey);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      platformRole: payload.platformRole as PlatformRole,
    };
  } catch {
    throw new AppError("UNAUTHENTICATED", "Invalid or expired access token", 401);
  }
}

export function generateSecureToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(token);
  return { token, hash };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken?: string }
): void {
  const isProduction = env.NODE_ENV === "production";

  res.cookies.set("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: env.JWT_ACCESS_TTL_SECONDS,
  });

  if (tokens.refreshToken) {
    res.cookies.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: `${env.API_BASE_PATH}/auth`,
      maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    });
  }
}

export function clearAuthCookies(res: NextResponse): void {
  const isProduction = env.NODE_ENV === "production";

  res.cookies.set("access_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: `${env.API_BASE_PATH}/auth`,
    maxAge: 0,
  });
}
