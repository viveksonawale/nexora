"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShinyButton } from "@/app/components/ShinyButton";
import { apiFetch } from "@/lib/api-client";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to create account");
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

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold">Check your email</h2>
        <p className="text-[var(--text-secondary)]">We sent a verification link to {email}</p>
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
        <h1 className="text-2xl font-display font-bold">Create an account</h1>
        <p className="text-[var(--text-secondary)] text-sm">Join Nexora to build and manage hackathons</p>
      </div>

      {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all outline-none"
          />
        </div>
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
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all outline-none"
          />
        </div>

        <ShinyButton variant="primary" className="w-full justify-center py-2.5" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
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
        Already have an account? <Link href="/sign-in" className="text-[var(--text-primary)] font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
