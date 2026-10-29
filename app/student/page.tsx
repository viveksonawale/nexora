"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Trophy,
  Users,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Compass,
  FileText,
  Mail,
  User,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";

export default function StudentDashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res: any = await apiFetch("/me/dashboard");
      setData(res);

      // Check if modal dismissed in this session
      const isDismissed = sessionStorage.getItem("nexora_resume_modal_dismissed");
      if (!isDismissed && res?.completeness && res.completeness.score < 100) {
        setShowIncompleteModal(true);
      }
    } catch (err: any) {
      console.error("Failed to load student dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDismissModal = () => {
    setShowIncompleteModal(false);
    sessionStorage.setItem("nexora_resume_modal_dismissed", "true");
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    setActionMessage(null);
    try {
      await apiFetch(`/team-invites/${inviteId}/accept`, { method: "POST" });
      setActionMessage("Successfully joined team!");
      await fetchData();
    } catch (err: any) {
      setActionMessage(err.message || "Failed to accept invite");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    setActionMessage(null);
    try {
      await apiFetch(`/team-invites/${inviteId}/decline`, { method: "POST" });
      setActionMessage("Invitation declined.");
      await fetchData();
    } catch (err: any) {
      setActionMessage(err.message || "Failed to decline invite");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingState message="Loading your dashboard..." />;

  const user = data?.user || {};
  const stats = data?.stats || {};
  const completeness = data?.completeness || { score: 0, missing: [], isComplete: false };
  const pendingInvites = data?.pendingInvites || [];
  const upcomingDeadlines = data?.upcomingDeadlines || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-br from-[#16181d] to-[#111215] border border-[#232630] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#1e2026] border border-zinc-700 flex items-center justify-center text-xl font-bold font-display text-white overflow-hidden shrink-0 shadow-lg">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              (user.name || "S").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                Welcome back, {user.name || "Hacker"}!
              </h1>
              {completeness.isComplete && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={13} /> Verified Builder
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              {user.headline || "Ready to hack, build, and win? Here is your real-time hackathon command center."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link href="/hackathons">
            <ShinyButton variant="primary" className="py-2.5 px-4 text-sm font-semibold">
              <Compass size={16} /> Explore Hackathons
            </ShinyButton>
          </Link>
          <Link href="/student/profile">
            <button className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 text-sm font-semibold transition-colors flex items-center gap-1.5">
              <User size={15} /> My Profile
            </button>
          </Link>
        </div>
      </div>

      {/* Minimal Incomplete Resume Banner */}
      {!completeness.isComplete && (
        <div className="p-4 sm:p-5 rounded-2xl border border-orange-500/25 bg-[#16181d]/90 backdrop-blur-md shadow-lg shadow-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse shrink-0" />
              <span className="font-display font-semibold text-sm sm:text-base text-white">
                Resume Completion
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#EA580C]/10 text-[#EA580C] border border-[#EA580C]/25">
                {completeness.score}%
              </span>
            </div>

            {/* Loading / Progress Track */}
            <div className="space-y-1 max-w-xl">
              <div className="h-2.5 w-full bg-zinc-800/90 rounded-full overflow-hidden border border-white/[0.05] p-[1px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-amber-500 transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${Math.max(completeness.score, 4)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                <span>Setup Progress</span>
                <span>{completeness.score}% Completed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <Link href="/student/resume">
              <ShinyButton variant="primary" size="sm" className="py-2 px-4 text-xs font-semibold whitespace-nowrap">
                Complete Resume <ArrowRight size={13} />
              </ShinyButton>
            </Link>
          </div>
        </div>
      )}

      {/* Completed Resume Banner (when 100%) */}
      {completeness.isComplete && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-white block">
                Resume & Profile 100% Complete
              </span>
              <span className="text-xs text-zinc-400">
                All profile sections satisfied. You are eligible for instant 1-click hackathon applications.
              </span>
            </div>
          </div>
          <Link
            href="/student/resume"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0"
          >
            Review Resume <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#232630] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Hackathons
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#F97316] flex items-center justify-center">
              <Trophy size={16} />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-white tracking-tight">
            {stats.totalHackathonsRegistered || 0}
          </div>
          <p className="text-[11px] text-zinc-400">Registered events</p>
        </div>

        {/* Active Hackathons */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#232630] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Active Events
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-white tracking-tight">
            {stats.activeHackathons || 0}
          </div>
          <p className="text-[11px] text-zinc-400">Ongoing participation</p>
        </div>

        {/* Hackathons Won */}
        <div className="p-5 rounded-2xl bg-[#14161b] border border-[#232630] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Podium Finishes
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-white tracking-tight">
            {stats.hackathonsWon || 0}
          </div>
          <p className="text-[11px] text-zinc-400">Prizes & award honors</p>
        </div>

        {/* Total Certificates */}
        <Link
          href="/student/certificates"
          className="p-5 rounded-2xl bg-[#14161b] hover:bg-[#191b22] hover:border-emerald-500/30 transition-all border border-[#232630] space-y-2 block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Certificates
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award size={16} />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-white tracking-tight">
            {stats.totalCertificates || 0}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">Download credentials &rarr;</p>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[#F97316] text-sm font-medium">
          {actionMessage}
        </div>
      )}

      {/* Pending Invitations Section (Prominent when available) */}
      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="text-[#F97316]" size={18} />
              <h2 className="text-lg font-display font-bold text-white">
                Pending Team Invitations ({pendingInvites.length})
              </h2>
            </div>
            <Link
              href="/student/invitations"
              className="text-xs font-semibold text-[#F97316] hover:underline flex items-center gap-1"
            >
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInvites.map((inv: any) => (
              <div
                key={inv.id}
                className="p-5 rounded-2xl bg-[#14161b] border border-orange-500/30 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F97316] px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                        {inv.hackathonTitle}
                      </span>
                      <h3 className="text-lg font-display font-bold text-white mt-1.5">
                        Team: {inv.teamName}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                      {inv.memberCount} members
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    Invited by <strong className="text-zinc-200">{inv.inviterName}</strong>. Accept
                    to join their roster and collaborate on this hackathon.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#232630]">
                  <button
                    disabled={actionLoading === inv.id}
                    onClick={() => handleAcceptInvite(inv.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
                  >
                    {actionLoading === inv.id ? "Processing..." : "Accept"}
                  </button>
                  <button
                    disabled={actionLoading === inv.id}
                    onClick={() => handleDeclineInvite(inv.id)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <Link
                    href={`/team-invite/${inv.token}`}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Upcoming Deadlines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Deadlines */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-400" size={18} />
              <h2 className="text-lg font-display font-bold text-white">Upcoming Deadlines</h2>
            </div>
            <Link
              href="/student/hackathons"
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
            >
              My Hackathons <ChevronRight size={13} />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-[#14161b] border border-[#232630] space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                No active deadlines right now. Ready for your next event?
                <div className="pt-3">
                  <Link
                    href="/hackathons"
                    className="text-xs text-[#F97316] font-semibold hover:underline"
                  >
                    Browse upcoming hackathons →
                  </Link>
                </div>
              </div>
            ) : (
              upcomingDeadlines.map((dl: any) => {
                const dateObj = new Date(dl.date);
                return (
                  <div
                    key={dl.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {dl.hackathonTitle}
                      </span>
                      <span className="text-[11px] text-[#F97316] font-medium block mt-0.5">
                        {dl.label}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-semibold text-zinc-300 block">
                        {dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 block">
                        {dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="text-emerald-400" size={18} />
              <h2 className="text-lg font-display font-bold text-white">Recent Activity</h2>
            </div>
            <Link
              href="/student/notifications"
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
            >
              All Notifications <ChevronRight size={13} />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-[#14161b] border border-[#232630] space-y-3">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                No recent activity recorded yet.
              </div>
            ) : (
              recentActivity.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">{act.title}</span>
                    <span className="text-[11px] text-zinc-400 block line-clamp-1">
                      {act.description}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                    {new Date(act.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-6 rounded-2xl bg-[#14161b] border border-[#232630] space-y-4">
        <h3 className="font-display font-bold text-sm text-zinc-400 uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/hackathons"
            className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-all"
          >
            <Compass size={16} className="text-[#F97316]" />
            <span>Find Hackathons</span>
          </Link>
          <Link
            href="/student/teams"
            className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-all"
          >
            <Users size={16} className="text-blue-400" />
            <span>My Teams</span>
          </Link>
          <Link
            href="/student/resume"
            className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-all"
          >
            <FileText size={16} className="text-emerald-400" />
            <span>Resume Builder</span>
          </Link>
          <Link
            href="/student/certificates"
            className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 transition-all"
          >
            <Award size={16} className="text-amber-400" />
            <span>Certificates</span>
          </Link>
        </div>
      </div>

      {/* Contextual Modal for Incomplete Resume (Dismissible, only once per session) */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-[#16181d] border border-orange-500/30 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={handleDismissModal}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#F97316] border border-orange-500/20 flex items-center justify-center">
              <Sparkles size={24} />
            </div>

            <div>
              <h3 className="text-xl font-display font-bold text-white">
                Boost Your Hackathon Profile
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Complete your profile to unlock 1-click team invites and official certifications.
              </p>
            </div>

            {/* Minimal Progress Bar */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400">Current Completion</span>
                <span className="text-[#EA580C] font-bold">{completeness.score}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/[0.04]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-amber-500 transition-all duration-700"
                  style={{ width: `${Math.max(completeness.score, 4)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link href="/student/resume" className="flex-1" onClick={handleDismissModal}>
                <ShinyButton variant="primary" className="w-full justify-center py-2.5 text-xs font-semibold">
                  Complete Your Resume
                </ShinyButton>
              </Link>
              <button
                onClick={handleDismissModal}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Dismiss for Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

