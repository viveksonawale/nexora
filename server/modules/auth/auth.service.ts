import crypto from "crypto";
import { db } from "@/server/lib/db";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";
import { hashPassword, verifyPassword } from "./password";
import {
  generateSecureToken,
  hashToken,
  signAccessToken,
} from "./tokens";
import { queueEmail } from "@/server/modules/email/email.service";

function generateSlug(name: string): string {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${clean || "user"}-${suffix}`;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await db.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError("CONFLICT", "An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const slug = generateSlug(input.name);
  const { token, hash } = generateSecureToken();
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        platformRole: "USER",
        status: "ACTIVE",
      },
    });

    await tx.profile.create({
      data: {
        userId: newUser.id,
        slug,
      },
    });

    await tx.emailToken.create({
      data: {
        userId: newUser.id,
        purpose: "VERIFY_EMAIL",
        tokenHash: hash,
        expiresAt: tokenExpiresAt,
      },
    });

    return newUser;
  });

  await queueEmail({
    toEmail: user.email,
    template: "verify_email",
    payload: {
      userId: user.id,
      name: user.name,
      token,
      url: `${env.APP_URL}/verify-email?token=${token}`,
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      platformRole: user.platformRole,
      status: user.status,
    },
    verificationToken: env.NODE_ENV === "test" ? token : undefined,
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const user = await db.user.findUnique({
    where: { email: input.email },
    include: {
      profile: { select: { slug: true, avatarUrl: true, onboardingCompleted: true } },
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError("UNAUTHENTICATED", "Invalid email or password", 401);
  }

  const passwordValid = await verifyPassword(user.passwordHash, input.password);
  if (!passwordValid) {
    throw new AppError("UNAUTHENTICATED", "Invalid email or password", 401);
  }

  if (user.status === "SUSPENDED") {
    throw new AppError("FORBIDDEN", "Your account has been suspended", 403);
  }

  const { token: refreshToken, hash: refreshTokenHash } = generateSecureToken();
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  const [session] = await db.$transaction([
    db.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
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

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      platformRole: user.platformRole,
      status: user.status,
      emailVerified: !!user.emailVerifiedAt,
      profile: user.profile,
    },
    accessToken,
    refreshToken,
    sessionId: session.id,
  };
}

export async function refreshSession(input: {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const tokenHash = hashToken(input.refreshToken);

  const session = await db.session.findUnique({
    where: { refreshTokenHash: tokenHash },
    include: { user: true },
  });

  if (!session) {
    throw new AppError("UNAUTHENTICATED", "Invalid refresh token", 401);
  }

  // Theft detection: Reusing a revoked refresh token revokes ALL user sessions
  if (session.revokedAt) {
    await db.session.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError("UNAUTHENTICATED", "Compromised session token reused. All sessions terminated.", 401);
  }

  if (session.expiresAt < new Date()) {
    throw new AppError("UNAUTHENTICATED", "Refresh token has expired", 401);
  }

  if (session.user.status === "SUSPENDED") {
    throw new AppError("FORBIDDEN", "Account suspended", 403);
  }

  // Rotate token
  const { token: newRefreshToken, hash: newRefreshTokenHash } = generateSecureToken();
  const newExpiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await db.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    await tx.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: newRefreshTokenHash,
        userAgent: input.userAgent || session.userAgent,
        ipAddress: input.ipAddress || session.ipAddress,
        expiresAt: newExpiresAt,
      },
    });
  });

  const accessToken = await signAccessToken({
    userId: session.user.id,
    email: session.user.email,
    platformRole: session.user.platformRole,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      platformRole: session.user.platformRole,
    },
  };
}

export async function logoutSession(refreshToken?: string, sessionId?: string) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await db.session.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } else if (sessionId) {
    await db.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export async function logoutAllSessions(userId: string) {
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);

  const emailToken = await db.emailToken.findUnique({
    where: { tokenHash },
  });

  if (
    !emailToken ||
    emailToken.purpose !== "VERIFY_EMAIL" ||
    emailToken.usedAt !== null ||
    emailToken.expiresAt < new Date()
  ) {
    throw new AppError("VALIDATION_FAILED", "Invalid or expired verification token", 400);
  }

  await db.$transaction(async (tx) => {
    await tx.emailToken.update({
      where: { id: emailToken.id },
      data: { usedAt: new Date() },
    });
    await tx.user.update({
      where: { id: emailToken.userId },
      data: { emailVerifiedAt: new Date() },
    });
  });

  return { message: "Email verified successfully" };
}

export async function resendVerificationEmail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("NOT_FOUND", "User not found", 404);
  }

  if (user.emailVerifiedAt) {
    return { message: "Email is already verified" };
  }

  const { token, hash } = generateSecureToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.emailToken.create({
    data: {
      userId: user.id,
      purpose: "VERIFY_EMAIL",
      tokenHash: hash,
      expiresAt,
    },
  });

  await queueEmail({
    toEmail: user.email,
    template: "verify_email",
    payload: {
      userId: user.id,
      name: user.name,
      token,
      url: `${env.APP_URL}/verify-email?token=${token}`,
    },
  });

  return { message: "Verification email sent", token: env.NODE_ENV === "test" ? token : undefined };
}

export async function forgotPassword(email: string) {
  const user = await db.user.findUnique({
    where: { email },
  });

  // Always return cleanly to avoid email enumeration
  if (user && user.status !== "SUSPENDED") {
    const { token, hash } = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.emailToken.create({
      data: {
        userId: user.id,
        purpose: "RESET_PASSWORD",
        tokenHash: hash,
        expiresAt,
      },
    });

    await queueEmail({
      toEmail: user.email,
      template: "reset_password",
      payload: {
        userId: user.id,
        name: user.name,
        token,
        url: `${env.APP_URL}/reset-password?token=${token}`,
      },
    });
  }
}

export async function resetPasswordWithToken(input: {
  token: string;
  newPassword: string;
}) {
  const tokenHash = hashToken(input.token);

  const emailToken = await db.emailToken.findUnique({
    where: { tokenHash },
  });

  if (
    !emailToken ||
    emailToken.purpose !== "RESET_PASSWORD" ||
    emailToken.usedAt !== null ||
    emailToken.expiresAt < new Date()
  ) {
    throw new AppError("VALIDATION_FAILED", "Invalid or expired reset token", 400);
  }

  const passwordHash = await hashPassword(input.newPassword);

  await db.$transaction(async (tx) => {
    await tx.emailToken.update({
      where: { id: emailToken.id },
      data: { usedAt: new Date() },
    });
    await tx.user.update({
      where: { id: emailToken.userId },
      data: { passwordHash },
    });
    // Revoke all existing sessions on password reset
    await tx.session.updateMany({
      where: { userId: emailToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  return { message: "Password reset successfully" };
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string }
) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    throw new AppError("VALIDATION_FAILED", "Current password is incorrect", 400);
  }

  const valid = await verifyPassword(user.passwordHash, input.currentPassword);
  if (!valid) {
    throw new AppError("VALIDATION_FAILED", "Current password is incorrect", 400);
  }

  const newHash = await hashPassword(input.newPassword);

  await db.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { message: "Password updated successfully" };
}

export async function getUserSessions(userId: string, currentSessionToken?: string) {
  const currentHash = currentSessionToken ? hashToken(currentSessionToken) : null;

  const sessions = await db.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    isCurrent: currentHash ? s.refreshTokenHash === currentHash : false,
  }));
}

export async function revokeUserSession(userId: string, sessionId: string) {
  const session = await db.session.findFirst({
    where: { id: sessionId, userId, revokedAt: null },
  });

  if (!session) {
    throw new AppError("NOT_FOUND", "Session not found or already revoked", 404);
  }

  await db.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  return { message: "Session revoked successfully" };
}
