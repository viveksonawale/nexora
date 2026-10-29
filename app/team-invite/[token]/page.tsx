"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Users,
  Shield,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  LogIn,
  UserPlus,
  Compass,
  Trophy,
  ExternalLink,
  X,
  XCircle,
} from "lucide-react";

export default function TeamInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { user } = useSession();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchInvite = async () => {
    try {
      const res: any = await apiFetch(`/team-invites/token/${token}`);
      setData(res);
    } catch (err: any) {
      setData({ valid: false, message: err.message || "Failed to load invitation" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvite();
  }, [token, user]);

  const handleAccept = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await apiFetch(`/team-invites/token/${token}/accept`, {
        method: "POST",
      });
      setSuccessMessage("Invitation accepted! Welcome to the squad.");
      setTimeout(() => {
        router.push("/student/teams");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to accept invitation");
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline this team invitation?")) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await apiFetch(`/team-invites/token/${token}/decline`, {
        method: "POST",
      });
      setSuccessMessage("You have declined this invitation.");
      await fetchInvite();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to decline invitation");
    } finally {
      setActionLoading(false);
    }
  };

  const openAuth = (tab: "login" | "signup") => {
    const returnUrl = `/team-invite/${token}`;
    window.dispatchEvent(
      new CustomEvent("open-auth-modal", {
        detail: { tab, returnUrl },
      })
    );
  };

  if (loading) return <LoadingState message="Verifying team invitation link..." />;

  // Case: Invalid, revoked, expired, or declined invite
  if (!data?.valid) {
    const isRevoked = data?.status === "REVOKED";
    const isExpired = data?.status === "EXPIRED";
    const isDeclined = data?.status === "DECLINED";
    const isAlreadyUsed = data?.status === "ACCEPTED";

    return (
      <div className="min-h-screen bg-[#0d0e11] text-zinc-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-3xl bg-[#14161b] border border-[#232630] p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
            {isRevoked ? (
              <XCircle size={32} />
            ) : isExpired ? (
              <Clock size={32} />
            ) : (
              <AlertCircle size={32} />
            )}
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20 mb-2">
              {isRevoked
                ? "INVITATION REVOKED"
                : isExpired
                ? "LINK EXPIRED"
                : isDeclined
                ? "INVITATION DECLINED"
                : isAlreadyUsed
                ? "ALREADY ACCEPTED"
                : "INVALID INVITATION"}
            </span>

            <h1 className="text-2xl font-display font-bold text-white">
              {isRevoked
                ? "Invitation Revoked"
                : isExpired
                ? "Invitation Expired"
                : isDeclined
                ? "Invitation Declined"
                : isAlreadyUsed
                ? "Link Already Claimed"
                : "Invalid Link"}
            </h1>

            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              {data?.message ||
                "This invitation link is not valid or is no longer active. Contact the team leader to generate a fresh invitation link."}
            </p>
          </div>

          {data?.teamName && (
            <div className="p-4 rounded-xl bg-[#0d0e11] border border-zinc-800 text-left text-xs space-y-1">
              <span className="text-zinc-500 block">Associated Team:</span>
              <strong className="text-white block text-sm">{data.teamName}</strong>
              {data.hackathonTitle && (
                <span className="text-[#F97316] font-mono text-[11px] block">
                  {data.hackathonTitle}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Link href="/hackathons">
              <ShinyButton variant="primary" size="sm" className="w-full justify-center py-2.5 text-xs font-semibold">
                Explore Hackathons
              </ShinyButton>
            </Link>
            <Link
              href="/student"
              className="py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const team = data.team;
  const hackathon = data.hackathon;
  const userStatus = data.userStatus || {};
  const leader = team.leader;
  const members = team.members || [];

  return (
    <div className="min-h-screen bg-[#0d0e11] text-zinc-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full rounded-3xl bg-[#14161b] border border-[#232630] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header / Brand */}
        <div className="flex items-center justify-between border-b border-[#1e2026] pb-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#F97316] font-display font-bold flex items-center justify-center text-xs">
              N
            </div>
            <span className="font-display font-bold text-base text-white tracking-tight">
              Nexora
            </span>
          </Link>

          <span className="text-xs font-mono font-bold text-[#F97316] px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            TEAM INVITATION
          </span>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Hackathon and Team Overview */}
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            You've been invited to join
          </span>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            {team.name}
          </h1>

          <div className="flex items-center gap-2 text-xs text-[#F97316] font-semibold">
            <Trophy size={14} />
            <span>{hackathon.title}</span>
          </div>

          {team.description && (
            <p className="text-xs text-zinc-300 leading-relaxed bg-[#0d0e11] p-3.5 rounded-2xl border border-[#1e2026]">
              "{team.description}"
            </p>
          )}
        </div>

        {/* Team Leader & Roster Preview */}
        <div className="p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Team Roster ({team.memberCount} / {team.maxTeamSize} Members)
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Mode: {hackathon.mode || "ONLINE"}
            </span>
          </div>

          <div className="space-y-2">
            {/* Leader Card */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1e2026] border border-zinc-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                  {leader.profile?.avatarUrl ? (
                    <img
                      src={leader.profile.avatarUrl}
                      alt={leader.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    leader.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <span>{leader.name}</span>
                    <Shield size={12} className="text-[#F97316]" />
                  </div>
                  <span className="text-[10px] text-zinc-500 block">Team Leader</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#F97316] px-2 py-0.5 rounded bg-orange-500/10">
                Leader
              </span>
            </div>

            {/* Other Members */}
            {members
              .filter((m: any) => m.user?.id !== leader.id)
              .map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1e2026] border border-zinc-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                      {m.user?.profile?.avatarUrl ? (
                        <img
                          src={m.user.profile.avatarUrl}
                          alt={m.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        m.user?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-white block">
                        {m.user?.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        {m.user?.profile?.headline || "Member"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Member</span>
                </div>
              ))}
          </div>
        </div>

        {/* Hackathon Dates & Deadlines */}
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-zinc-500" />
            Starts: {new Date(hackathon.startsAt).toLocaleDateString()}
          </span>
          <span>Ends: {new Date(hackathon.endsAt).toLocaleDateString()}</span>
        </div>

        {/* Status Evaluator & Actions */}
        {!user ? (
          /* Unauthenticated State: Offer Sign In / Sign Up */
          <div className="p-5 rounded-2xl bg-orange-500/[0.06] border border-orange-500/20 space-y-4 text-center">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-white">
                Sign in to join this team
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Create an account or log in with your existing platform credentials to accept this invitation.
              </p>
            </div>

            <div className="flex items-center gap-3 justify-center pt-1">
              <ShinyButton
                variant="primary"
                size="sm"
                onClick={() => openAuth("login")}
                className="py-2.5 px-6 text-xs font-semibold gap-1.5"
              >
                <LogIn size={14} /> Log In
              </ShinyButton>
              <button
                onClick={() => openAuth("signup")}
                className="px-5 py-2.5 rounded-xl border border-zinc-700 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-200 transition-colors flex items-center gap-1.5"
              >
                <UserPlus size={14} /> Create Account
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated State */
          <div className="space-y-4">
            {/* Condition 1: Registration Required */}
            {!userStatus.isRegistered && (
              <div className="p-5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-white">
                      Hackathon Registration Required
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Accepting a team invitation requires an approved registration for{" "}
                      <strong>{hackathon.title}</strong>. Register first to claim your spot on this team.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/hackathons/${hackathon.id}/register?returnUrl=/team-invite/${token}`}>
                    <ShinyButton variant="primary" size="sm" className="w-full justify-center py-2.5 text-xs font-semibold">
                      Register for {hackathon.title} <ArrowRight size={14} />
                    </ShinyButton>
                  </Link>
                </div>
              </div>
            )}

            {/* Condition 2: Registration Pending Approval */}
            {userStatus.isRegistered && userStatus.registrationStatus === "PENDING" && (
              <div className="p-5 rounded-2xl bg-yellow-500/[0.08] border border-yellow-500/30 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Clock size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-white">
                      Registration Awaiting Approval
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Your hackathon registration has been submitted and is currently pending organizer approval. Once approved, you can accept this invitation directly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Condition 3: Already Member */}
            {userStatus.isAlreadyMember && (
              <div className="p-5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span className="text-xs text-zinc-200">
                    You are already a member of <strong>{team.name}</strong>.
                  </span>
                </div>
                <Link
                  href="/student/teams"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors shrink-0"
                >
                  Go to Team
                </Link>
              </div>
            )}

            {/* Condition 4: Already In Another Team */}
            {userStatus.isAlreadyInAnotherTeam && (
              <div className="p-4 rounded-2xl bg-red-500/[0.08] border border-red-500/30 flex items-start gap-2.5">
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  You are already a member of another team in this hackathon. A participant cannot join multiple teams in the same event.
                </div>
              </div>
            )}

            {/* Condition 5: Team Full */}
            {team.isFull && !userStatus.isAlreadyMember && (
              <div className="p-4 rounded-2xl bg-red-500/[0.08] border border-red-500/30 flex items-start gap-2.5">
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  This team has reached the maximum capacity of {team.maxTeamSize} members.
                </div>
              </div>
            )}

            {/* Action Buttons when eligible to accept */}
            {userStatus.canAccept && (
              <div className="flex items-center gap-3 pt-2">
                <ShinyButton
                  variant="primary"
                  size="md"
                  disabled={actionLoading}
                  onClick={handleAccept}
                  className="flex-1 justify-center py-3 text-sm font-semibold"
                >
                  {actionLoading ? "Joining..." : "Accept Invitation & Join Team"}
                </ShinyButton>
                <button
                  disabled={actionLoading}
                  onClick={handleDecline}
                  className="px-5 py-3 rounded-xl border border-zinc-700 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="pt-2 text-center border-t border-[#1e2026]">
          <Link
            href="/student"
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Student Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

