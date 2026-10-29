"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { Users2, Search, ArrowUpRight, Trophy, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { NorButton } from "@/components/ui/nor-button";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/teams");
      setTeams(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete team "${name}" and its project submission?`)) {
      return;
    }
    try {
      await apiFetch(`/admin/teams/${id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete team");
    }
  };

  const filtered = teams.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.hackathon?.title.toLowerCase().includes(term) ||
      t.leader?.name?.toLowerCase().includes(term) ||
      t.leader?.email?.toLowerCase().includes(term)
    );
  });

  if (loading) return <LoadingState message="Loading platform teams from Supabase..." />;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Teams Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Monitor hacker teams, team formation, project submissions, and leaders.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-mono font-semibold text-[var(--text-primary)]">
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
            placeholder="Search by team name, hackathon, or leader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#F97316]/50"
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
                <th className="px-6 py-4 font-semibold">Hackathon</th>
                <th className="px-6 py-4 font-semibold">Leader</th>
                <th className="px-6 py-4 font-semibold">Members</th>
                <th className="px-6 py-4 font-semibold">Submission</th>
                <th className="px-6 py-4 font-semibold text-right">Invite Code</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-xs text-[var(--text-secondary)]">
                    No teams match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--bg-canvas)]/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                          <Users2 size={15} />
                        </div>
                        <span className="font-semibold text-[var(--text-primary)]">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--text-primary)]">{t.hackathon?.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">{t.hackathon?.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--text-primary)]">{t.leader?.name || "Participant"}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">{t.leader?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">
                      {t._count?.members || 1}
                    </td>
                    <td className="px-6 py-4">
                      {t.submission ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 size={12} />
                          SUBMITTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock size={12} />
                          IN PROGRESS
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-[var(--text-secondary)]">
                      {t.inviteCode}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <NorButton
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-400 hover:border-red-500/40"
                        onClick={() => handleDeleteTeam(t.id, t.name)}
                        title="Delete Team"
                      >
                        <Trash2 size={13} />
                      </NorButton>
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

