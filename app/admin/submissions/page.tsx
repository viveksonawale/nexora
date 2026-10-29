"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { FileText, Search, ExternalLink, Code2, Globe, CheckCircle2, Trash2 } from "lucide-react";
import { NorButton } from "@/components/ui/nor-button";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/submissions");
      setSubmissions(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteSubmission = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete submission "${title}" and its scores?`)) {
      return;
    }
    try {
      await apiFetch(`/admin/submissions/${id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete submission");
    }
  };

  const filtered = submissions.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(term) ||
      s.hackathon?.title.toLowerCase().includes(term) ||
      s.team?.name?.toLowerCase().includes(term)
    );
  });

  if (loading) return <LoadingState message="Loading submissions from Supabase..." />;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Submissions Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Review submitted code repositories, demo links, tech stacks, and judging readiness.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-mono font-semibold text-[var(--text-primary)]">
          Total Submissions: <span className="text-rose-500">{submissions.length}</span>
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
            placeholder="Search by project title, hackathon, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#F97316]/50"
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
                <th className="px-6 py-4 font-semibold">Hackathon</th>
                <th className="px-6 py-4 font-semibold">Team</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Links</th>
                <th className="px-6 py-4 font-semibold text-right">Code</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-xs text-[var(--text-secondary)]">
                    No submissions match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-canvas)]/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                          <FileText size={15} />
                        </div>
                        <div>
                          <span className="font-semibold text-[var(--text-primary)] block">{s.title}</span>
                          <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-xs block font-sans">
                            {s.tagline || "Autonomous software submission"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--text-primary)]">{s.hackathon?.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">{s.hackathon?.slug}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                      {s.team?.name || "Independent"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 size={12} />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        {s.repoUrl && (
                          <a
                            href={s.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[#F97316] transition-colors"
                            title="Repository"
                          >
                            <Code2 size={14} />
                            <span>Repo</span>
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
                    <td className="px-6 py-4 text-right font-mono text-xs text-[var(--text-secondary)]">
                      {s.anonymousCode}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <NorButton
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-400 hover:border-red-500/40"
                        onClick={() => handleDeleteSubmission(s.id, s.title)}
                        title="Delete Submission"
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
