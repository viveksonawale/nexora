"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { History, Search, ShieldCheck, User, Calendar, Clock } from "lucide-react";

export default function OrganizerAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/hackathons/${id}/audit-log`);
      setLogs(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [id]);

  const filtered = logs.filter((l) => {
    const term = search.toLowerCase();
    const actor = l.actor?.name?.toLowerCase() || l.actor?.email?.toLowerCase() || "";
    const action = l.action?.toLowerCase() || "";
    const entity = l.entityType?.toLowerCase() || "";
    return actor.includes(term) || action.includes(term) || entity.includes(term);
  });

  if (loading) return <LoadingState message="Loading event audit history..." />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Event Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Immutable log of team actions, staff modifications, judging scoring, and submission events.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-mono font-semibold text-[var(--text-primary)]">
          Total Events: <span className="text-[#F97316]">{logs.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by action, user, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#F97316]/50 transition-colors"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--bg-canvas)]/40 border-b border-[var(--border)] text-[var(--text-secondary)] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Actor</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Target Entity</th>
                <th className="px-6 py-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-[var(--text-secondary)]">
                    No audit records found matching your query.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-canvas)]/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--text-primary)]">{log.actor?.name || "System"}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">{log.actor?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide bg-orange-500/10 text-[#F97316] border border-orange-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--text-primary)]">
                      {log.entityType} {log.entityId ? `(${log.entityId.slice(0, 8)}...)` : ""}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-[var(--text-secondary)] font-mono max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
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
