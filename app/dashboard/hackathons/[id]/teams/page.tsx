"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { Users2, Search, ArrowLeft, Trophy, CheckCircle2, Clock, Copy, Check } from "lucide-react";

export default function OrganizerTeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/hackathons/${id}/teams`);
      setTeams(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [id]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filtered = teams.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.leader?.name?.toLowerCase().includes(term) ||
      t.leader?.email?.toLowerCase().includes(term)
    );
  });

  if (loading) return <LoadingState message="Loading hackathon teams..." />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Teams
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Manage participating teams, track team formation, and view team leaders.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-mono font-semibold text-[var(--text-primary)]">
          Total Teams: <span className="text-[#F97316]">{teams.length}</span>
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
            placeholder="Search teams by name or leader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#F97316]/50 transition-colors"
          />
        </div>
      </div>

      {/* Teams Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--bg-canvas)]/40 border-b border-[var(--border)] text-[var(--text-secondary)] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Team Name</th>
                <th className="px-6 py-4 font-semibold">Leader</th>
                <th className="px-6 py-4 font-semibold">Members Count</th>
                <th className="px-6 py-4 font-semibold">Recruiting Status</th>
                <th className="px-6 py-4 font-semibold text-right">Invite Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-[var(--text-secondary)]">
                    No teams have been formed yet.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--bg-canvas)]/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#F97316] border border-orange-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                          <Users2 size={15} />
                        </div>
                        <div>
                          <span className="font-semibold text-[var(--text-primary)] block">{t.name}</span>
                          {t.description && (
                            <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-xs block font-sans">
                              {t.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--text-primary)]">{t.leader?.name || "Participant"}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">{t.leader?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">
                      {t._count?.members || 1} members
                    </td>
                    <td className="px-6 py-4">
                      {t.lookingForMembers ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          RECRUITING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          FULL
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.inviteCode ? (
                        <button
                          onClick={() => copyToClipboard(t.inviteCode)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-[#F97316]/50 text-[var(--text-primary)] transition-colors"
                          title="Click to copy code"
                        >
                          {copiedCode === t.inviteCode ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} className="text-[var(--text-secondary)]" />
                              <span>{t.inviteCode}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[var(--text-secondary)] font-mono text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
