import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as registerHandler } from "@/app/api/v1/auth/register/route";
import { POST as loginHandler } from "@/app/api/v1/auth/login/route";
import { POST as verifyEmailHandler } from "@/app/api/v1/auth/verify-email/route";
import { POST as forgotPasswordHandler } from "@/app/api/v1/auth/forgot-password/route";
import { db } from "@/server/lib/db";
import { hashPassword } from "@/server/modules/auth/password";
import { hashToken } from "@/server/modules/auth/tokens";

describe("Auth Route Handlers", () => {
  it("POST /api/v1/auth/register - validates payload and registers user", async () => {
    vi.spyOn(db.user, "findUnique").mockResolvedValueOnce(null);

    const txMock = {
      user: {
        create: vi.fn().mockResolvedValue({
          id: "u_new",
          name: "Alice Smith",
          email: "alice@example.com",
          platformRole: "USER",
          status: "ACTIVE",
        }),
      },
      profile: { create: vi.fn().mockResolvedValue({}) },
      emailToken: { create: vi.fn().mockResolvedValue({}) },
    };

    vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: unknown) => {
      if (typeof callback === "function") {
        return (callback as (tx: unknown) => unknown)(txMock);
      }
      return callback;
    });

    vi.spyOn(db.emailOutbox, "create").mockResolvedValueOnce({} as unknown as ReturnType<typeof db.emailOutbox.create> extends Promise<infer U> ? U : never);

    const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Smith",
        email: "alice@example.com",
        password: "StrongPassword123!",
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.user.email).toBe("alice@example.com");
  });

  it("POST /api/v1/auth/login - returns tokens and sets cookies on successful login", async () => {
    const passwordHash = await hashPassword("ValidPassword123!");
    vi.spyOn(db.user, "findUnique").mockResolvedValueOnce({
      id: "u_alice",
      email: "alice@example.com",
      name: "Alice Smith",
      passwordHash,
      platformRole: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      profile: { slug: "alice-smith", avatarUrl: null, onboardingCompleted: true },
    } as unknown as ReturnType<typeof db.user.findUnique> extends Promise<infer U> ? U : never);

    vi.spyOn(db, "$transaction").mockResolvedValueOnce([
      { id: "sess_new", expiresAt: new Date() },
      { id: "u_alice" },
    ] as unknown as ReturnType<typeof db.$transaction> extends Promise<infer U> ? U : never);

    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        password: "ValidPassword123!",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.email).toBe("alice@example.com");
    expect(body.data.accessToken).toBeDefined();

    // Check cookies
    const cookies = res.cookies.getAll();
    expect(cookies.some((c) => c.name === "access_token")).toBe(true);
    expect(cookies.some((c) => c.name === "refresh_token")).toBe(true);
  });

  it("POST /api/v1/auth/verify-email - verifies token successfully", async () => {
    const token = "raw_email_token_123";
    vi.spyOn(db.emailToken, "findUnique").mockResolvedValueOnce({
      id: "tok_1",
      userId: "u_alice",
      purpose: "VERIFY_EMAIL",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60000),
      usedAt: null,
    } as unknown as ReturnType<typeof db.emailToken.findUnique> extends Promise<infer U> ? U : never);

    vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback: unknown) => {
      if (typeof callback === "function") {
        return (callback as (tx: unknown) => unknown)({
          emailToken: { update: vi.fn().mockResolvedValue({}) },
          user: { update: vi.fn().mockResolvedValue({}) },
        });
      }
      return callback;
    });

    const req = new NextRequest("http://localhost:3000/api/v1/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const res = await verifyEmailHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.message).toBe("Email verified successfully");
  });

  it("POST /api/v1/auth/forgot-password - always returns 204", async () => {
    vi.spyOn(db.user, "findUnique").mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "random@example.com" }),
    });

    const res = await forgotPasswordHandler(req);
    expect(res.status).toBe(204);
  });
});
