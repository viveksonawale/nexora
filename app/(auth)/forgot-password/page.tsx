"use client";

import { useState } from "react";
import Link from "next/link";
import { ShinyButton } from "@/app/components/ShinyButton";
import { apiFetch } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold">Check your email</h2>
        <p className="text-[var(--text-secondary)]">If an account exists with {email}, we've sent a password reset link.</p>
        <div className="pt-4">
          <Link href="/sign-in" className="text-[var(--accent)] hover:underline">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold">Reset Password</h1>
        <p className="text-[var(--text-secondary)] text-sm">Enter your email and we'll send you a link to reset your password.</p>
      </div>

      {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}

      <form onSubmit={handleForgot} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all outline-none"
          />
        </div>

        <ShinyButton variant="primary" className="w-full justify-center py-2.5" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </ShinyButton>
      </form>
      
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Remember your password? <Link href="/sign-in" className="text-[var(--text-primary)] font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
