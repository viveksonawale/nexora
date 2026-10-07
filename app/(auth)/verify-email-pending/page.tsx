"use client";

import { useSession } from "@/lib/contexts/SessionContext";
import { ShinyButton } from "@/app/components/ShinyButton";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";

function VerifyPendingContent() {
  const { user } = useSession();
  const router = useRouter();
  
  const handleResend = async () => {
    try {
      await apiFetch("/auth/resend-verification", { method: "POST" });
      alert("Verification email resent!");
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || "Failed to resend");
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      router.push("/sign-in");
    } catch {
      router.push("/sign-in");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-bold">Verify Your Email</h1>
        <p className="text-[var(--text-secondary)]">
          You need to verify your email address before continuing. We sent a link to <span className="font-medium text-[var(--text-primary)]">{user?.email}</span>.
        </p>
        <div className="pt-2 flex flex-col gap-3">
          <ShinyButton variant="primary" onClick={handleResend} className="w-full justify-center">
            Resend Email
          </ShinyButton>
          <button onClick={handleLogout} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPendingPage() {
  return (
    <RequireAuth>
      <VerifyPendingContent />
    </RequireAuth>
  );
}
