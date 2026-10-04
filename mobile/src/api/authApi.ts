import { request } from "./client";
import type { AuthResult, Role, User } from "@/types/api";

export const authApi = {
  signup: (b: { name: string; email: string; password: string; college: string; role: Role }) =>
    request<{ email: string; requiresOtp: boolean }>("/auth/signup", { method: "POST", body: b, auth: false }),
  verifyOtp: (email: string, code: string) =>
    request<AuthResult>("/auth/verify-otp", { method: "POST", body: { email, code }, auth: false }),
  resendOtp: (email: string) => request<{ ok: true }>("/auth/resend-otp", { method: "POST", body: { email }, auth: false }),
  login: (email: string, password: string) =>
    request<AuthResult>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  forgotPassword: (email: string) => request<{ ok: true }>("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (b: { email: string; code: string; password: string }) =>
    request<{ ok: true }>("/auth/reset-password", { method: "POST", body: b, auth: false }),
  me: () => request<{ user: User }>("/auth/me"),
  updateMe: (b: { name?: string; college?: string }) => request<{ user: User }>("/auth/me", { method: "PATCH", body: b }),
};
