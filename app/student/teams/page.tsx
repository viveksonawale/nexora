"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Users,
  Shield,
  Plus,
  Share2,
  UserPlus,
  Copy,
  Check,
  Trash2,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Search,
  X,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function MyTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeInviteTab, setActiveInviteTab] = useState<"SEARCH" | "LINK">("SEARCH");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  // Search platform users state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Share link state
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLinkToken, setShareLinkToken] = useState<string | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Team management action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchTeams = async () => {
    try {
      const data: any = await apiFetch("/me/teams");
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
      if (list.length > 0) {
        // preserve currently selected team or select first
        setSelectedTeam((prev: any) => {
          if (!prev) return list[0];
          const found = list.find((t: any) => t.id === prev.id);
          return found || list[0];
        });
      } else {
        setSelectedTeam(null);
      }
    } catch (err) {
      console.error("Failed to load teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Live debounce search
  useEffect(() => {
    if (!searchQuery.trim() || !selectedTeam) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setInviteError("");
      try {
        const results: any = await apiFetch(
          `/users/search?q=${encodeURIComponent(searchQuery)}&hackathonId=${selectedTeam.hackathonId}`
        );
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (err: any) {
        console.error("Search error", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedTeam]);

  const handleOpenInviteModal = async (team: any) => {
    setSelectedTeam(team);
    setSearchQuery("");
    setSearchResults([]);
    setInviteError("");
    setInviteSuccess("");
    setActiveInviteTab("SEARCH");
    setShowInviteModal(true);

    // Look for existing shareable link in invites
    const existingShare = team.invites?.find(
      (inv: any) => !inv.invitedUserId && !inv.email && inv.status === "PENDING" && new Date(inv.expiresAt) > new Date()
    );
    if (existingShare) {
      const url = `${window.location.origin}/team-invite/${existingShare.tokenHash}`;
      setShareLink(url);
      setShareLinkToken(existingShare.tokenHash);
    } else {
      setShareLink(null);
      setShareLinkToken(null);
    }
  };

  const handleGenerateShareLink = async () => {
    if (!selectedTeam) return;
    setGeneratingLink(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const res: any = await apiFetch(`/teams/${selectedTeam.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ isShareLink: true }),
      });
      const url = `${window.location.origin}/team-invite/${res.tokenHash}`;
      setShareLink(url);
      setShareLinkToken(res.tokenHash);
      setInviteSuccess("Shareable invitation link created!");
      await fetchTeams();
    } catch (err: any) {
      setInviteError(err.message || "Failed to generate link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2000);
  };

  const handleSendUserInvite = async (targetUser: any) => {
    if (!selectedTeam) return;
    setInvitingUserId(targetUser.id);
    setInviteError("");
    setInviteSuccess("");
    try {
      await apiFetch(`/teams/${selectedTeam.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ userId: targetUser.id }),
      });
      setInviteSuccess(`Invitation successfully sent to ${targetUser.name}!`);
      // Update local search results flag
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, hasPendingInvite: true } : u))
      );
      await fetchTeams();
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invitation");
    } finally {
      setInvitingUserId(null);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    if (!selectedTeam) return;
    setActionLoading(`resend-${inviteId}`);
    setActionError("");
    setActionSuccess("");
    try {
      await apiFetch(`/teams/${selectedTeam.id}/invites/${inviteId}/resend`, {
        method: "POST",
      });
      setActionSuccess("Invitation resent successfully!");
      await fetchTeams();
    } catch (err: any) {
      setActionError(err.message || "Failed to resend invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    setActionLoading(`revoke-${inviteId}`);
    setActionError("");
    setActionSuccess("");
    try {
      await apiFetch(`/team-invites/${inviteId}`, {
        method: "DELETE",
      });
      setActionSuccess("Invitation revoked.");
      await fetchTeams();
    } catch (err: any) {
      setActionError(err.message || "Failed to revoke invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!selectedTeam) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    setActionLoading(`remove-${memberUserId}`);
    setActionError("");
    setActionSuccess("");
    try {
      await apiFetch(`/teams/${selectedTeam.id}/members/${memberUserId}`, {
        method: "DELETE",
      });
      setActionSuccess(`Removed ${memberName} from the team.`);
      await fetchTeams();
    } catch (err: any) {
      setActionError(err.message || "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferLeadership = async (newLeaderUserId: string, memberName: string) => {
    if (!selectedTeam) return;
    if (!confirm(`Transfer team leadership to ${memberName}? You will become an ordinary member.`))
      return;

    setActionLoading(`transfer-${newLeaderUserId}`);
    setActionError("");
    setActionSuccess("");
    try {
      await apiFetch(`/teams/${selectedTeam.id}/transfer-leadership`, {
        method: "POST",
        body: JSON.stringify({ userId: newLeaderUserId }),
      });
      setActionSuccess(`Transferred leadership to ${memberName}.`);
      await fetchTeams();
    } catch (err: any) {
      setActionError(err.message || "Failed to transfer leadership");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to leave this team?")) return;
    setActionLoading(`leave-${teamId}`);
    setActionError("");
    setActionSuccess("");
    try {
      await apiFetch(`/teams/${teamId}/leave`, {
        method: "POST",
      });
      setActionSuccess("You have left the team.");
      await fetchTeams();
    } catch (err: any) {
      setActionError(err.message || "Failed to leave team");
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setJoinLoading(true);
    setJoinError("");
    setJoinSuccess("");
    try {
      // If user pasted a full link, extract token/code
      let codeOrToken = joinCodeInput.trim();
      if (codeOrToken.includes("/team-invite/")) {
        const parts = codeOrToken.split("/team-invite/");
        codeOrToken = parts[1]?.split("?")[0] || codeOrToken;
      }

      // If token length is long, accept by token; otherwise join with code
      if (codeOrToken.length > 10) {
        await apiFetch(`/team-invites/token/${codeOrToken}/accept`, { method: "POST" });
      } else {
        await apiFetch("/teams/join", {
          method: "POST",
          body: JSON.stringify({ inviteCode: codeOrToken.toUpperCase() }),
        });
      }

      setJoinSuccess("Successfully joined team!");
      setJoinCodeInput("");
      await fetchTeams();
    } catch (err: any) {
      setJoinError(err.message || "Failed to join team. Check the code and your registration status.");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading your teams..." />;

  const isLeader = selectedTeam?.isLeader;
  const maxTeamSize = selectedTeam?.hackathon?.maxTeamSize || 4;
  const currentMembersCount = selectedTeam?.members?.length || 0;
  const isTeamFull = currentMembersCount >= maxTeamSize;

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Team Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your rosters, send invitations, generate shareable links, and collaborate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/student/invitations">
            <button className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 transition-colors">
              Pending Invites
            </button>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
          {actionSuccess}
        </div>
      )}

      {/* Join Team with Code Card */}
      <div className="p-6 rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-[#F97316]" />
          <h3 className="font-display font-bold text-base text-white">
            Join a Team with Code or Invitation Link
          </h3>
        </div>
        <p className="text-xs text-zinc-400">
          Have an invite code or link from a team leader? Enter it below to join their squad.
        </p>

        <form onSubmit={handleJoinWithCode} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            placeholder="e.g. 4B2F89 or paste full invitation link..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#F97316] font-mono"
          />
          <ShinyButton
            variant="primary"
            size="sm"
            disabled={joinLoading}
            className="py-2.5 px-6 text-xs font-semibold whitespace-nowrap"
          >
            {joinLoading ? "Joining..." : "Join Team"}
          </ShinyButton>
        </form>

        {joinError && <div className="text-xs text-red-400 mt-1">{joinError}</div>}
        {joinSuccess && <div className="text-xs text-emerald-400 mt-1">{joinSuccess}</div>}
      </div>

      {/* Main Teams Display */}
      {teams.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-[#F97316] flex items-center justify-center mx-auto">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">No Teams Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              You haven't formed or joined any teams yet. Register for a hackathon and create your squad, or join an existing one.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/hackathons">
              <ShinyButton variant="primary" size="sm" className="py-2 px-4 text-xs font-semibold">
                Explore Hackathons
              </ShinyButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Team Selector List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 px-1">
              Your Teams ({teams.length})
            </h3>
            <div className="space-y-2">
              {teams.map((t) => {
                const isSelected = selectedTeam?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeam(t)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-[#181a20] border-[#F97316]/50 shadow-md ring-1 ring-[#F97316]/30"
                        : "bg-[#14161b] border-[#232630] hover:border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-white truncate">
                        {t.name}
                      </span>
                      {t.isLeader ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Leader
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-700/50 text-zinc-400">
                          Member
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 block mt-1 truncate">
                      {t.hackathon?.title}
                    </span>
                    <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-zinc-500">
                      <span>
                        {t.members?.length || 0} / {t.hackathon?.maxTeamSize || 4} members
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Selected Team Workspace */}
          {selectedTeam && (
            <div className="lg:col-span-2 space-y-6">
              <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-6">
                {/* Team Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#1e2026]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F97316] px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                        {selectedTeam.hackathon?.title}
                      </span>
                      {isLeader && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-400">
                          <Shield size={13} /> Team Leader
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-display font-bold text-white mt-2">
                      {selectedTeam.name}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                      {selectedTeam.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLeader ? (
                      <button
                        onClick={() => handleOpenInviteModal(selectedTeam)}
                        disabled={isTeamFull}
                        className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <UserPlus size={15} />
                        <span>Invite Members</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeaveTeam(selectedTeam.id)}
                        className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <LogOut size={14} />
                        <span>Leave Team</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Team Capacity Indicator */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026]">
                  <div>
                    <span className="text-xs font-semibold text-zinc-300 block">
                      Team Capacity: {currentMembersCount} / {maxTeamSize} Members
                    </span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      {isTeamFull
                        ? "Team roster is full. Maximum hackathon squad size reached."
                        : `${maxTeamSize - currentMembersCount} open spot(s) remaining.`}
                    </span>
                  </div>

                  {isLeader && (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                          Invite Code
                        </span>
                        <span className="text-sm font-mono font-bold text-[#F97316]">
                          {selectedTeam.inviteCode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Members List */}
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-base text-white">
                    Team Members ({currentMembersCount})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTeam.members?.map((m: any) => {
                      const u = m.registration?.user;
                      const isMemberLeader = m.role === "LEADER" || u.id === selectedTeam.leaderId;

                      return (
                        <div
                          key={m.id}
                          className="p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#1e2026] border border-zinc-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                              {u.profile?.avatarUrl ? (
                                <img
                                  src={u.profile.avatarUrl}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (u.name || "M").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-display font-bold text-sm text-white flex items-center gap-1.5 truncate">
                                <span>{u.name}</span>
                                {isMemberLeader && (
                                  <Shield size={12} className="text-[#F97316] shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-zinc-400 block truncate">
                                {u.profile?.headline || (isMemberLeader ? "Team Leader" : "Team Member")}
                              </span>
                            </div>
                          </div>

                          {/* Leader management actions for other members */}
                          {isLeader && !isMemberLeader && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleTransferLeadership(u.id, u.name)}
                                title="Transfer leadership"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                              >
                                <Shield size={14} />
                              </button>
                              <button
                                onClick={() => handleRemoveMember(u.id, u.name)}
                                title="Remove member"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sent Invitations Status (Only visible to Team Leader) */}
                {isLeader && (
                  <div className="space-y-3 pt-4 border-t border-[#1e2026]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold text-base text-white">
                        Sent Invitations & History ({selectedTeam.invites?.length || 0})
                      </h3>
                      <button
                        onClick={() => handleOpenInviteModal(selectedTeam)}
                        className="text-xs font-semibold text-[#F97316] hover:underline"
                      >
                        + Send New Invite
                      </button>
                    </div>

                    {!selectedTeam.invites || selectedTeam.invites.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] text-center text-xs text-zinc-400">
                        No invitations sent yet. Click "Invite Members" to search platform students or generate a shareable link.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedTeam.invites.map((inv: any) => {
                          const isExpired =
                            inv.status === "PENDING" && new Date(inv.expiresAt) < new Date();
                          const displayStatus = isExpired ? "EXPIRED" : inv.status;
                          const recipientName =
                            inv.invitedUser?.name || inv.email || "Shareable Link Token";

                          return (
                            <div
                              key={inv.id}
                              className="p-3.5 rounded-2xl bg-[#0d0e11] border border-[#1e2026] flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="font-semibold text-zinc-200 truncate flex items-center gap-2">
                                  <span>{recipientName}</span>
                                  {!inv.invitedUserId && !inv.email && (
                                    <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.2 rounded bg-white/[0.04]">
                                      Link Invite
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono text-zinc-400 block">
                                  Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    displayStatus === "ACCEPTED"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : displayStatus === "PENDING"
                                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                      : displayStatus === "DECLINED"
                                      ? "bg-zinc-700/50 text-zinc-400"
                                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                                  }`}
                                >
                                  {displayStatus}
                                </span>

                                {displayStatus === "PENDING" && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleResendInvite(inv.id)}
                                      title="Resend invitation"
                                      className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                                    >
                                      <RefreshCw size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleRevokeInvite(inv.id)}
                                      title="Revoke invitation"
                                      className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Team Submission Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/5 to-transparent border border-[#1e2026] flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">Project Workspace</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {selectedTeam.submission
                        ? `Project: "${selectedTeam.submission.title}" (${selectedTeam.submission.status})`
                        : "Draft and submit your hackathon project before the deadline."}
                    </p>
                  </div>

                  <Link
                    href={`/hackathons/${selectedTeam.hackathonId}/submission`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-white border border-zinc-700 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <FileText size={14} />
                    <span>Open Submission</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal (Search and Invite OR Share Link) */}
      {showInviteModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-[#16181d] border border-[#232630] rounded-3xl p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-xl font-display font-bold text-white">
                Invite Members to {selectedTeam.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Hackathon: <strong>{selectedTeam.hackathon?.title}</strong> ({currentMembersCount}/
                {maxTeamSize} spots filled)
              </p>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#232630] gap-2 pb-2">
              <button
                onClick={() => setActiveInviteTab("SEARCH")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeInviteTab === "SEARCH"
                    ? "bg-[#F97316] text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Search Platform Students
              </button>
              <button
                onClick={() => setActiveInviteTab("LINK")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeInviteTab === "LINK"
                    ? "bg-[#F97316] text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Shareable Invitation Link
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                {inviteSuccess}
              </div>
            )}

            {/* Tab 1: Search Platform Users */}
            {activeInviteTab === "SEARCH" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, username (@slug), or email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                  {searchLoading ? (
                    <div className="py-8 text-center text-xs text-zinc-400">Searching students...</div>
                  ) : searchQuery.trim().length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      Type at least 1 character to search platform users.
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      No matching students found.
                    </div>
                  ) : (
                    searchResults.map((u) => {
                      const isAlreadyMember = selectedTeam.members?.some(
                        (m: any) => m.registration?.user?.id === u.id
                      );
                      const isRegistered = u.isRegistered;
                      const hasPending = u.hasPendingInvite;

                      return (
                        <div
                          key={u.id}
                          className="p-3 rounded-xl bg-[#0d0e11] border border-[#232630] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#1e2026] border border-zinc-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (u.name || "U").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-white truncate block">
                                {u.name}
                              </span>
                              <span className="text-[11px] text-zinc-400 truncate block">
                                {u.headline || u.college || u.email}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isAlreadyMember ? (
                              <span className="text-[11px] font-mono text-zinc-500">
                                In this team
                              </span>
                            ) : u.isAlreadyInTeam ? (
                              <span className="text-[11px] font-mono text-amber-500">
                                In another team
                              </span>
                            ) : hasPending ? (
                              <span className="text-[11px] font-mono text-yellow-400">
                                Invite Sent
                              </span>
                            ) : (
                              <button
                                disabled={invitingUserId === u.id || isTeamFull}
                                onClick={() => handleSendUserInvite(u)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F97316] hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
                              >
                                {invitingUserId === u.id ? "Sending..." : "Send Invite"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Shareable Link */}
            {activeInviteTab === "LINK" && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Generate a unique shareable invitation link. Anyone who opens this link can review team details and accept the invite if they meet hackathon rules.
                </p>

                {shareLink ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0d0e11] border border-zinc-700">
                      <input
                        type="text"
                        readOnly
                        value={shareLink}
                        className="flex-1 bg-transparent text-xs font-mono text-zinc-300 focus:outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        {shareLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{shareLinkCopied ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                      <span>Valid for 7 days</span>
                      <button
                        onClick={handleGenerateShareLink}
                        disabled={generatingLink}
                        className="text-[#F97316] hover:underline text-xs font-semibold"
                      >
                        {generatingLink ? "Regenerating..." : "Regenerate Link"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#0d0e11] border border-[#232630] text-center space-y-3">
                    <p className="text-xs text-zinc-400">
                      No active shareable invitation link yet for this team.
                    </p>
                    <ShinyButton
                      variant="primary"
                      size="sm"
                      disabled={generatingLink || isTeamFull}
                      onClick={handleGenerateShareLink}
                      className="py-2.5 px-6 text-xs font-semibold"
                    >
                      {generatingLink ? "Generating..." : "Generate Invitation Link"}
                    </ShinyButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

