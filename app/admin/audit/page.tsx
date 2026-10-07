"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { History } from "lucide-react";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/audit-log");
      setLogs(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading audit logs..." />;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Audit Log</h1>
          <p className="text-[var(--text-secondary)] font-sans mt-2">
            System-wide activity monitoring.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left font-sans">
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Action</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Entity Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Entity ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-secondary)] flex flex-col items-center">
                  <History size={32} className="mb-4 opacity-50" />
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-primary)] font-medium">
                    {log.user ? log.user.name : "System"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded font-mono text-xs text-[var(--text-primary)]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {log.entityType}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-[var(--text-secondary)]">
                    {log.entityId}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
