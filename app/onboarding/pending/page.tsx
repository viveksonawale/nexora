"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  Scale,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

function PendingVerificationContent() {
  const router = useRouter();
  const { user, refreshSession } = useSession();

  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const checkStatus = async () => {
    setRefreshing(true);
    try {
      const data = await apiFetch<any>("/verifications/me");
      setStatusData(data);

      if (data?.onboardingStatus === "VERIFIED") {
        await refreshSession();
        const verifiedRole = data?.requestedRole || user?.requestedRole;
        if (verifiedRole === "COLLEGE_ORGANIZER") {
          router.replace("/dashboard");
        } else if (verifiedRole === "JUDGE") {
          router.replace("/judge/assignments");
        } else {
          router.replace("/student");
        }
        return;
      }

      const role = data?.requestedRole || data?.request?.type || user?.requestedRole;
      if (role === "STUDENT") {
        await refreshSession();
        router.replace("/student");
        return;
      }
    } catch {
      // Ignore
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const role = statusData?.requestedRole || user?.requestedRole || "STUDENT";

  useEffect(() => {
    if (!loading && role === "STUDENT") {
      router.replace("/student");
    }
  }, [loading, role, router]);

  if (loading) {
    return <LoadingState message="Checking verification status..." />;
  }

  if (role === "STUDENT") {
    return <LoadingState message="Redirecting to your student dashboard..." />;
  }

  const isRejected = statusData?.onboardingStatus === "REJECTED" || statusData?.request?.status === "REJECTED";
  const request = statusData?.request;
  const institutionName = request?.organization?.name || request?.details?.newCollegeName || request?.details?.organization;

  if (isRejected) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] py-16 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-[var(--bg-elevated)] border border-red-500/20 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xl shadow-black/5">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
              <AlertCircle size={36} />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-red-500 font-semibold">
                Status: Application Not Approved
              </span>
              <h1 className="text-3xl font-display font-light text-[var(--text-primary)]">
                Verification Rejected
              </h1>
              <p className="text-sm text-[var(--text-secondary)] font-sans max-w-sm mx-auto">
                Your request for organizer/evaluator privileges could not be approved by the institutional administrator.
              </p>
            </div>

            {request?.rejectionReason && (
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-left space-y-1.5">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                  Reviewer Feedback / Reason:
                </span>
                <p className="text-sm text-[var(--text-primary)]">
                  "{request.rejectionReason}"
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border)] text-left space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                <span>REQUESTED ROLE</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {role === "COLLEGE_ORGANIZER" ? "College Organizer" : role === "JUDGE" ? "Judge / Evaluator" : "Student"}
                </span>
              </div>
              {institutionName && (
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] border-t border-[var(--border)] pt-2">
                  <span>COLLEGE / INSTITUTION</span>
                  <span className="font-medium text-[var(--text-primary)]">{institutionName}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/onboarding" className="w-full sm:w-auto">
                <ShinyButton variant="primary" className="w-full justify-center">
                  Update Details & Resubmit <ArrowRight size={14} className="ml-1" />
                </ShinyButton>
              </Link>
              <Link href="/hackathons" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] text-xs font-sans text-[var(--text-primary)] hover:border-[var(--accent)] transition-all">
                  Browse Hackathons
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] py-16 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Main Card */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xl shadow-black/5">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center animate-pulse">
            <Clock size={36} />
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
              Status: Under Review
            </span>
            <h1 className="text-3xl font-display font-light text-[var(--text-primary)]">
              Verification Pending
            </h1>
            <p className="text-sm text-[var(--text-secondary)] font-sans max-w-sm mx-auto">
              Your proof of identity has been submitted and is currently in the institutional approval queue.
            </p>
          </div>

          {/* Details badge */}
          <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border)] text-left space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
              <span>REQUESTED STANDING</span>
              <span className="font-bold text-[var(--text-primary)]">
                {role === "STUDENT" && "Student"}
                {role === "COLLEGE_ORGANIZER" && "College Organizer"}
                {role === "JUDGE" && "Judge / Evaluator"}
              </span>
            </div>

            {institutionName && (
              <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] border-t border-[var(--border)] pt-2">
                <span>COLLEGE / INSTITUTION</span>
                <span className="font-medium text-[var(--text-primary)]">{institutionName}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] border-t border-[var(--border)] pt-2">
              <span>REVIEWER</span>
              <span className="text-[var(--text-primary)]">
                {role === "STUDENT"
                  ? "College Admin"
                  : role === "COLLEGE_ORGANIZER"
                  ? "College Admin / Platform Admin"
                  : "Platform Admin"}
              </span>
            </div>
          </div>

          {/* What happens meanwhile */}
          <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/15 text-left space-y-2 text-xs font-sans text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-[var(--accent)]" /> What you can do meanwhile:
            </span>
            {role === "STUDENT" ? (
              <p>
                You can browse all upcoming hackathons and submit your event registrations.
                Your verified resume achievements and official credentials will activate as soon as your college administrator approves your account.
              </p>
            ) : role === "COLLEGE_ORGANIZER" ? (
              <p>
                Your request to manage college events is being reviewed by your institution administrator.
                You will be notified by email as soon as event-creation privileges are unlocked.
              </p>
            ) : (
              <p>
                Platform Administrators are reviewing your technical background.
                Judge evaluation rooms will be accessible once you accept an event invitation from a hackathon organizer.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={checkStatus}
              disabled={refreshing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] text-xs font-sans text-[var(--text-primary)] hover:border-[var(--accent)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Check Status
            </button>

            <Link href="/hackathons" className="w-full sm:w-auto">
              <ShinyButton variant="primary" className="w-full justify-center">
                Browse Hackathons <ArrowRight size={14} className="ml-1" />
              </ShinyButton>
            </Link>
          </div>

        </div>

        {/* Footer help */}
        <p className="text-center text-xs font-mono text-[var(--text-secondary)]">
          Need urgent approval for a live event? Contact your college administrator or platform support.
        </p>

      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <RequireAuth requireOnboarding={false}>
        <PendingVerificationContent />
      </RequireAuth>
    </Suspense>
  );
}
