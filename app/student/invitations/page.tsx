"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Users,
  RefreshCw,
  X,
} from "lucide-react";

export default function StudentInvitationsPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchInvites = async () => {
    try {
      const data: any = await apiFetch("/me/team-invites?all=true");
      setInvites(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load invites", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleAccept = async (inviteId: string) => {
    setActionLoading(`accept-${inviteId}`);
    setMessage(null);
    try {
      await apiFetch(`/team-invites/${inviteId}/accept`, { method: "POST" });
      setMessage({ text: "Successfully joined team!", type: "success" });
      await fetchInvites();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to accept invitation", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (inviteId: string) => {
    setActionLoading(`decline-${inviteId}`);
    setMessage(null);
    try {
      await apiFetch(`/team-invites/${inviteId}/decline`, { method: "POST" });
      setMessage({ text: "Invitation declined.", type: "success" });
      await fetchInvites();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to decline invitation", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingState message="Loading your invitations..." />;

  const pendingInvites = invites.filter((inv) => inv.status === "PENDING");
  const historyInvites = invites.filter((inv) => inv.status !== "PENDING");
  const displayed = activeTab === "PENDING" ? pendingInvites : historyInvites;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Accepted
          </span>
        );
      case "DECLINED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-700/50 text-zinc-300">
            <XCircle size={12} /> Declined
          </span>
        );
      case "REVOKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle size={12} /> Revoked
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={12} /> Expired
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock size={12} /> Pending Response
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs text-zinc-400">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Team Invitations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review invitations from team leaders and manage your responses.
          </p>
        </div>

        <Link href="/student/teams">
          <ShinyButton variant="secondary" size="sm" className="gap-1.5 py-2 px-3 text-xs">
            <Users size={14} className="text-[#F97316]" />
            <span>Manage My Teams</span>
          </ShinyButton>
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#1e2026] gap-3 pb-2">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "PENDING"
              ? "bg-[#F97316] text-white"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <span>Pending Invitations</span>
          {pendingInvites.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-black font-bold">
              {pendingInvites.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "HISTORY"
              ? "bg-[#F97316] text-white"
              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <span>Invitation History ({historyInvites.length})</span>
        </button>
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#14161b] border border-[#232630] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#F97316] flex items-center justify-center mx-auto">
            <Mail size={24} />
          </div>
          <h3 className="text-base font-display font-bold text-white">
            {activeTab === "PENDING" ? "No Pending Invitations" : "No Invitation History"}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {activeTab === "PENDING"
              ? "When other platform builders invite you to join their hackathon teams, their requests will appear right here."
              : "Past accepted, declined, expired, and revoked invitations will be recorded here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((inv) => {
            const team = inv.team;
            const hackathon = team?.hackathon;
            const leader = team?.leader;
            const isPending = inv.status === "PENDING";

            return (
              <div
                key={inv.id}
                className="p-6 rounded-3xl bg-[#14161b] border border-[#232630] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F97316] px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                      {hackathon?.title || "Hackathon Event"}
                    </span>
                    {getStatusBadge(inv.status)}
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-bold text-white">{team?.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Team Leader: <strong className="text-zinc-200">{leader?.name}</strong>{" "}
                      {leader?.profile?.headline && `(${leader.profile.headline})`} • Roster:{" "}
                      {team?._count?.members || 1} member(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
                    <span>Sent: {new Date(inv.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {isPending ? (
                    <>
                      <button
                        disabled={actionLoading === `accept-${inv.id}`}
                        onClick={() => handleAccept(inv.id)}
                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `accept-${inv.id}` ? "Joining..." : "Accept Invitation"}
                      </button>
                      <button
                        disabled={actionLoading === `decline-${inv.id}`}
                        onClick={() => handleDecline(inv.id)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <Link
                      href={`/team-invite/${inv.tokenHash}`}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5"
                    >
                      <span>View Details</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

