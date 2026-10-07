"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShinyButton } from "@/app/components/ShinyButton";
import { apiFetch } from "@/lib/api-client";
import { LoadingState, ErrorState } from "@/components/shared/states";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Missing verification token.");
      return;
    }

    const verifyToken = async () => {
      try {
        await apiFetch("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        setStatus("success");
      } catch (err: unknown) {
        const e = err as Error;
        setStatus("error");
        setErrorMsg(e.message || "Failed to verify email. The link may be expired.");
      }
    };

    verifyToken();
  }, [token]);

  if (status === "loading") {
    return <LoadingState message="Verifying your email..." />;
  }

  if (status === "error") {
    return <ErrorState title="Verification Failed" message={errorMsg} onRetry={() => router.push("/sign-in")} />;
  }

  return (
    <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-display font-bold">Email Verified!</h2>
      <p className="text-[var(--text-secondary)]">Your email has been successfully verified.</p>
      <div className="pt-4">
        <ShinyButton variant="primary" onClick={() => router.push("/sign-in")} className="w-full justify-center">
          Continue to Sign In
        </ShinyButton>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
