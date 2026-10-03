import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/server/lib/db";
import {
  registerUser,
  loginUser,
  refreshSession,
  verifyEmailToken,
  resetPasswordWithToken,
} from "@/server/modules/auth/auth.service";
import { hashPassword } from "@/server/modules/auth/password";
import { hashToken } from "@/server/modules/auth/tokens";

describe("Auth Service Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerUser", () => {
    it("rejects registration if email already exists", async () => {
      vi.spyOn(db.user, "findUnique").mockResolvedValueOnce({ id: "1" } as unknown as ReturnType<typeof db.user.findUnique> extends Promise<infer U> ? U : never);

      await expect(
        registerUser({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123!",
        })
      ).rejects.toThrow("An account with this email already exists");
    });
  });

  describe("loginUser", () => {
    it("rejects non-existent user with generic invalid credentials error", async () => {
      vi.spyOn(db.user, "findUnique").mockResolvedValueOnce(null);

      await expect(
        loginUser({
          email: "nonexistent@example.com",
          password: "password",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("rejects suspended user", async () => {
      const passwordHash = await hashPassword("password123");
      vi.spyOn(db.user, "findUnique").mockResolvedValueOnce({
        id: "u_suspended",
        email: "suspended@example.com",
        passwordHash,
        status: "SUSPENDED",
        platformRole: "USER",
        emailVerifiedAt: new Date(),
        profile: { slug: "suspended-user", avatarUrl: null, onboardingCompleted: true },
      } as unknown as ReturnType<typeof db.user.findUnique> extends Promise<infer U> ? U : never);

      await expect(
        loginUser({
          email: "suspended@example.com",
          password: "password123",
        })
      ).rejects.toThrow("suspended");
    });
  });

  describe("refreshSession and Theft Detection", () => {
    it("detects token theft: revoking ALL user sessions when a revoked refresh token is reused", async () => {
      const testToken = "old_compromised_token";
      const tokenHash = hashToken(testToken);

      vi.spyOn(db.session, "findUnique").mockResolvedValueOnce({
        id: "sess_1",
        userId: "u_victim",
        refreshTokenHash: tokenHash,
        revokedAt: new Date(Date.now() - 10000), // Already revoked!
        expiresAt: new Date(Date.now() + 1000000),
        user: { id: "u_victim", email: "victim@example.com", status: "ACTIVE", platformRole: "USER" },
      } as unknown as ReturnType<typeof db.session.findUnique> extends Promise<infer U> ? U : never);

      const updateManySpy = vi.spyOn(db.session, "updateMany").mockResolvedValueOnce({ count: 3 } as unknown as ReturnType<typeof db.session.updateMany> extends Promise<infer U> ? U : never);

      await expect(
        refreshSession({
          refreshToken: testToken,
        })
      ).rejects.toThrow("Compromised session token reused. All sessions terminated.");

      expect(updateManySpy).toHaveBeenCalledWith({
        where: { userId: "u_victim", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("verifyEmailToken", () => {
    it("rejects expired or used email tokens", async () => {
      const token = "invalid_or_expired_token";
      vi.spyOn(db.emailToken, "findUnique").mockResolvedValueOnce({
        id: "tok_1",
        userId: "u1",
        purpose: "VERIFY_EMAIL",
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() - 1000), // Expired
        usedAt: null,
      } as unknown as ReturnType<typeof db.emailToken.findUnique> extends Promise<infer U> ? U : never);

      await expect(verifyEmailToken(token)).rejects.toThrow("Invalid or expired verification token");
    });
  });

  describe("resetPasswordWithToken", () => {
    it("resets password and revokes all active sessions", async () => {
      const resetToken = "valid_reset_token";
      vi.spyOn(db.emailToken, "findUnique").mockResolvedValueOnce({
        id: "tok_reset",
        userId: "u_reset",
        purpose: "RESET_PASSWORD",
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
      } as unknown as ReturnType<typeof db.emailToken.findUnique> extends Promise<infer U> ? U : never);

      const txMock = {
        emailToken: { update: vi.fn().mockResolvedValue({}) },
        user: { update: vi.fn().mockResolvedValue({}) },
        session: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
      };

      vi.spyOn(db, "$transaction").mockImplementationOnce(async (args: unknown) => {
        if (typeof args === "function") return (args as (tx: unknown) => unknown)(txMock);
        return Array.isArray(args) ? Promise.all(args) : args;
      });

      const res = await resetPasswordWithToken({
        token: resetToken,
        newPassword: "NewSecurePassword123!",
      });

      expect(res.message).toBe("Password reset successfully");
      expect(txMock.session.updateMany).toHaveBeenCalledWith({
        where: { userId: "u_reset", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
