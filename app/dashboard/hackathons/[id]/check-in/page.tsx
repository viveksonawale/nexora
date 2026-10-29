"use client";

import { useState, useEffect, use } from "react";
import { AttendanceHeader } from "@/components/attendance/AttendanceHeader";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import {
  ExternalLink,
  ShieldCheck,
  Play,
  Pause,
  StopCircle,
  RefreshCw,
  Copy,
  Check,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  Eye,
  KeyRound,
} from "lucide-react";

interface PresentStudent {
  recordId: string;
  userId: string;
  name: string;
  email: string;
  teamName: string | null;
  method: "QR" | "MANUAL";
  markedAt: string;
  markedBy: { id: string; name: string } | null;
}

interface AbsentStudent {
  registrationId: string;
  userId: string;
  name: string;
  email: string;
  teamName: string | null;
}

interface AttendanceRoster {
  session: {
    id: string;
    hackathonId: string;
    title: string;
    status: "ACTIVE" | "PAUSED" | "ENDED";
    startedAt: string;
    endedAt: string | null;
  };
  metrics: {
    totalApproved: number;
    presentCount: number;
    absentCount: number;
  };
  present: PresentStudent[];
  absent: AbsentStudent[];
}

export default function AttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [hackathon, setHackathon] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [roster, setRoster] = useState<AttendanceRoster | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"present" | "absent">("present");
  const [displayLink, setDisplayLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 1. Initial Load: Hackathon and Active Session
  const loadSessionAndRoster = async () => {
    try {
      const [hackData, sessionData] = await Promise.all([
        apiFetch<any>(`/hackathons/${id}`),
        apiFetch<any>(`/hackathons/${id}/attendance/sessions`).catch(() => null),
      ]);

      setHackathon(hackData);
      setSession(sessionData);

      if (sessionData?.id) {
        const rosterData = await apiFetch<AttendanceRoster>(
          `/hackathons/${id}/attendance/sessions/${sessionData.id}/records`
        ).catch(() => null);
        if (rosterData) setRoster(rosterData);
      }
    } catch (err: any) {
      console.error("Failed to load attendance management:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionAndRoster();
    const interval = setInterval(() => {
      if (session?.id) {
        apiFetch<AttendanceRoster>(`/hackathons/${id}/attendance/sessions/${session.id}/records`)
          .then((data) => {
            if (data) setRoster(data);
          })
          .catch(() => {});
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [id, session?.id]);

  // Start new session
  const handleStartSession = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res: any = await apiFetch(`/hackathons/${id}/attendance/sessions`, {
        method: "POST",
        body: JSON.stringify({ title: `${hackathon?.title || "Hackathon"} Live Session` }),
      });
      setSession(res.session);
      setDisplayLink(res.displayLink);
      await loadSessionAndRoster();
    } catch (err: any) {
      setActionError(err.message || "Failed to start attendance session. Ensure hackathon is LIVE.");
    } finally {
      setActionLoading(false);
    }
  };

  // Status changes: Pause, Resume, End
  const handleStatusChange = async (newStatus: "ACTIVE" | "PAUSED" | "ENDED") => {
    if (!session?.id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await apiFetch(
        `/hackathons/${id}/attendance/sessions/${session.id}/status`,
        {
          method: "POST",
          body: JSON.stringify({ status: newStatus }),
        }
      );
      setSession(updated);
      await loadSessionAndRoster();
    } catch (err: any) {
      setActionError(err.message || "Failed to update session status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Regenerate Display Link
  const handleRegenerateDisplayKey = async () => {
    if (!session?.id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res: any = await apiFetch(
        `/hackathons/${id}/attendance/sessions/${session.id}/display-key`,
        { method: "POST" }
      );
      setDisplayLink(res.displayLink);
    } catch (err: any) {
      setActionError(err.message || "Failed to regenerate display key.");
    } finally {
      setActionLoading(false);
    }
  };

  // Manual mark present for absent student
  const handleManualMark = async (userId: string) => {
    if (!session?.id) return;
    setActionLoading(true);
    try {
      await apiFetch(
        `/hackathons/${id}/attendance/sessions/${session.id}/manual-mark`,
        {
          method: "POST",
          body: JSON.stringify({ userId }),
        }
      );
      await loadSessionAndRoster();
    } catch (err: any) {
      alert(err.message || "Failed to mark attendance.");
    } finally {
      setActionLoading(false);
    }
  };

  const copyDisplayUrl = () => {
    if (!displayLink) return;
    const fullUrl = `${window.location.origin}${displayLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isLive = hackathon?.status === "LIVE";

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F97316] bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
              Organizer Control
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Event Status: <strong className={isLive ? "text-emerald-400" : "text-amber-400"}>{hackathon?.status || "Loading..."}</strong>
            </span>
          </div>
          <h1 className="text-3xl font-display font-extrabold text-[var(--text-primary)]">
            Live QR Attendance Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Control the dynamic rotating QR code on venue screens, monitor real-time check-ins, and manage student attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/hackathons/${id}/check-in`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold transition-colors"
          >
            <ExternalLink size={14} />
            Participant View
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Session Controls Header Card */}
      <div className="p-6 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Current Session:</span>
              <span className="text-base font-bold text-[var(--text-primary)]">
                {session?.title || "No Active Session"}
              </span>
              {session?.status && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                    session.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : session.status === "PAUSED"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}
                >
                  {session.status}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {!isLive
                ? "Note: Attendance sessions can only be started while the hackathon is transitioned to LIVE state."
                : "Dynamic attendance rotates every 7 seconds cryptographically to prevent fraud and proxy scanning."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {!session || session.status === "ENDED" ? (
              <button
                onClick={handleStartSession}
                disabled={actionLoading || !isLive}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-[#F97316] text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20"
              >
                <Play size={14} />
                <span>Start New Session</span>
              </button>
            ) : (
              <>
                {session.status === "ACTIVE" ? (
                  <button
                    onClick={() => handleStatusChange("PAUSED")}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors"
                  >
                    <Pause size={14} />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange("ACTIVE")}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                  >
                    <Play size={14} />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  onClick={() => handleStatusChange("ENDED")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
                >
                  <StopCircle size={14} />
                  <span>End Session</span>
                </button>

                <button
                  onClick={handleRegenerateDisplayKey}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--bg-canvas)] hover:bg-zinc-800 text-[var(--text-secondary)] hover:text-white border border-[var(--border)] text-xs font-medium transition-colors"
                  title="Regenerate display link (invalidates old screen key)"
                >
                  <RefreshCw size={13} className={actionLoading ? "animate-spin" : ""} />
                  <span>Regenerate Link</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Display Link Card (When generated or active) */}
        {displayLink && (
          <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F97316]">
                <KeyRound size={16} />
                <span>Unguessable Projector Display Link (Active)</span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Key hash stored securely. Never shared with attendees.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}${displayLink}`}
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] select-all"
              />
              <button
                onClick={copyDisplayUrl}
                className="px-4 py-2 rounded-xl bg-[#F97316] text-white text-xs font-semibold hover:bg-orange-600 transition-colors flex items-center gap-1.5"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
              <Link
                href={displayLink}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-[#F97316]/50 text-[var(--text-primary)] text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Eye size={14} />
                <span>Open Projector</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-medium text-[var(--text-secondary)] uppercase">
              Approved Registrants
            </div>
            <div className="text-3xl font-display font-extrabold text-[var(--text-primary)] mt-1">
              {roster?.metrics.totalApproved ?? 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-medium text-emerald-400 uppercase">
              Present / Checked In
            </div>
            <div className="text-3xl font-display font-extrabold text-emerald-400 mt-1">
              {roster?.metrics.presentCount ?? 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-medium text-zinc-400 uppercase">
              Absent / Pending Scan
            </div>
            <div className="text-3xl font-display font-extrabold text-zinc-400 mt-1">
              {roster?.metrics.absentCount ?? 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center">
            <UserX size={24} />
          </div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="p-6 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("present")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "present"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Present Students ({roster?.present.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("absent")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "absent"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Absent Students ({roster?.absent.length ?? 0})
            </button>
          </div>

          <span className="text-xs text-[var(--text-secondary)] font-mono">
            Auto-refreshes every 4s
          </span>
        </div>

        {activeTab === "present" ? (
          roster?.present.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              No students have checked in for this session yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Checked In At</th>
                    <th className="py-3 px-4">Marked By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {roster?.present.map((item) => (
                    <tr key={item.recordId} className="hover:bg-[var(--bg-canvas)]/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] font-mono">
                        {item.email}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {item.teamName || "Independent"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                            item.method === "QR"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {item.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] font-mono">
                        {new Date(item.markedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                        {item.markedBy?.name || "Self (QR)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          roster?.absent.length === 0 ? (
            <div className="py-12 text-center text-emerald-400 text-xs font-semibold">
              All approved participants have checked in! 100% attendance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {roster?.absent.map((item) => (
                    <tr key={item.userId} className="hover:bg-[var(--bg-canvas)]/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] font-mono">
                        {item.email}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {item.teamName || "Independent"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleManualMark(item.userId)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-[#F97316] text-[#F97316] hover:text-white border border-orange-500/30 text-xs font-semibold transition-all"
                        >
                          Mark Present (Manual)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
