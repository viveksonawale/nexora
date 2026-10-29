"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import {
  FileText,
  Search,
  ExternalLink,
  Code2,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
} from "lucide-react";

export default function OrganizerSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/hackathons/${id}/submissions`);
      setSubmissions(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [id]);

  const handleDisqualify = async (submissionId: string) => {
    const reason = prompt("Enter reason for disqualification (e.g. plagiarized code, rule violation):");
    if (!reason) return;

    try {
      setActionLoading(submissionId);
      await apiFetch(`/submissions/${submissionId}/disqualify`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message || "Failed to disqualify submission");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReinstate = async (submissionId: string) => {
    if (!confirm("Are you sure you want to reinstate this submission?")) return;

    try {
      setActionLoading(submissionId);
      await apiFetch(`/submissions/${submissionId}/reinstate`, {
        method: "POST",
      });
      fetchSubmissions();
    } catch (err: any) {
      alert(err.message || "Failed to reinstate submission");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = submissions.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(term) ||
      s.team?.name?.toLowerCase().includes(term) ||
      s.tagline?.toLowerCase().includes(term)
    );
  });

  if (loading) return <LoadingState message="Loading hackathon submissions..." />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Submissions
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Review submitted projects, inspect code repositories, and verify judging compliance.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-mono font-semibold text-[var(--text-primary)]">
          Total Submissions: <span className="text-[#F97316]">{submissions.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects by title or team name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#F97316]/50 transition-colors"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--bg-canvas)]/40 border-b border-[var(--border)] text-[var(--text-secondary)] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Project Title</th>
                <th className="px-6 py-4 font-semibold">Team</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Artifacts</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-[var(--text-secondary)]">
                    No submissions found for this hackathon.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isDisqualified = s.status === "DISQUALIFIED";
                  const isBusy = actionLoading === s.id;

                  return (
                    <tr key={s.id} className="hover:bg-[var(--bg-canvas)]/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                            <FileText size={15} />
                          </div>
                          <div>
                            <span className="font-semibold text-[var(--text-primary)] block">{s.title}</span>
                            <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-sm block font-sans">
                              {s.tagline || "Autonomous project solution"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--text-primary)]">{s.team?.name || "Independent"}</div>
                        <div className="text-[11px] text-[var(--text-secondary)] font-mono">{s.team?.leader?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isDisqualified ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                              <AlertTriangle size={11} />
                              DISQUALIFIED
                            </span>
                            {s.disqualifiedNote && (
                              <div className="text-[10px] text-red-400 mt-1 max-w-xs">{s.disqualifiedNote}</div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 size={11} />
                            {s.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-xs">
                          {s.repoUrl && (
                            <a
                              href={s.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[#F97316] transition-colors"
                              title="Code Repository"
                            >
                              <Code2 size={14} />
                              <span>Code</span>
                            </a>
                          )}
                          {s.demoUrl && (
                            <a
                              href={s.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[#F97316] transition-colors"
                              title="Live Demo"
                            >
                              <Globe size={14} />
                              <span>Demo</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isDisqualified ? (
                          <button
                            onClick={() => handleReinstate(s.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={13} />
                            <span>Reinstate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDisqualify(s.id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <Ban size={13} />
                            <span>Disqualify</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
