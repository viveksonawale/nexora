import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/server/modules/auth/password";
import {
  signAccessToken,
  verifyAccessToken,
  generateSecureToken,
  hashToken,
} from "@/server/modules/auth/tokens";

describe("Password and Token Utilities", () => {
  it("hashes and verifies passwords using Argon2id", async () => {
    const plain = "SuperSecretPassword123!";
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$argon2id$")).toBe(true);

    const isValid = await verifyPassword(hash, plain);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword(hash, "WrongPassword");
    expect(isInvalid).toBe(false);
  });

  it("signs and verifies JWT access tokens with jose", async () => {
    const payload = {
      userId: "user_test_123",
      email: "test@nexora.app",
      platformRole: "USER" as const,
    };

    const token = await signAccessToken(payload);
    expect(typeof token).toBe("string");

    const decoded = await verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.platformRole).toBe(payload.platformRole);
  });

  it("fails verification on tampered JWT access tokens", async () => {
    const payload = {
      userId: "user_test_123",
      email: "test@nexora.app",
      platformRole: "USER" as const,
    };

    const token = await signAccessToken(payload);
    const tampered = token.slice(0, -5) + "abcde";

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it("generates cryptographic tokens and matching SHA-256 hashes", () => {
    const { token, hash } = generateSecureToken();

    expect(token).toHaveLength(64);
    expect(hash).toHaveLength(64);
    expect(hashToken(token)).toBe(hash);
  });
});
