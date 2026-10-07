"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShinyButton } from "@/app/components/ShinyButton";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useSession();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refreshSession();
      const returnUrl = searchParams.get("returnUrl") || "/explore";
      router.push(returnUrl);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/v1/auth/oauth/google/start";
  };
  
  const handleGithubSignIn = () => {
    window.location.href = "/api/v1/auth/oauth/github/start";
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold">Welcome back</h1>
        <p className="text-[var(--text-secondary)] text-sm">Sign in to your Nexora account</p>
      </div>

      {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}

      <form onSubmit={handleSignIn} className="space-y-4">
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
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs text-[var(--accent)] hover:underline">Forgot?</Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all outline-none"
          />
        </div>

        <ShinyButton variant="primary" className="w-full justify-center py-2.5" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </ShinyButton>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-[var(--border)]"></div>
        <span className="flex-shrink-0 mx-4 text-[var(--text-secondary)] text-xs uppercase font-medium">Or continue with</span>
        <div className="flex-grow border-t border-[var(--border)]"></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-2 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors text-sm font-medium"
        >
          Google
        </button>
        <button
          onClick={handleGithubSignIn}
          className="flex items-center justify-center gap-2 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors text-sm font-medium"
        >
          GitHub
        </button>
      </div>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Don't have an account? <Link href="/sign-up" className="text-[var(--text-primary)] font-medium hover:underline">Sign up</Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <SignInContent />
    </Suspense>
  );
}
