"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShinyButton } from "@/app/components/ShinyButton";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token.");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold">Password Reset!</h2>
        <p className="text-[var(--text-secondary)]">Your password has been successfully reset. You will be logged out everywhere.</p>
        <div className="pt-4">
          <Link href="/sign-in">
            <ShinyButton variant="primary" className="w-full justify-center">
              Go to Sign In
            </ShinyButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold">New Password</h1>
        <p className="text-[var(--text-secondary)] text-sm">Enter your new password below.</p>
      </div>

      {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}

      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">New Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all outline-none"
          />
        </div>

        <ShinyButton variant="primary" className="w-full justify-center py-2.5" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </ShinyButton>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
