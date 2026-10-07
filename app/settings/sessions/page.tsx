"use client";

import { useState, useEffect } from "react";

import { apiFetch } from "@/lib/api-client";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/states";

interface Session {
  id: string;
  userAgent?: string;
  ip?: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function SessionsSettingsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Session[]>("/auth/sessions");
      setSessions(data);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      setRevoking(id);
      await apiFetch(`/auth/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || "Failed to revoke session.");
    } finally {
      setRevoking(null);
    }
  };

  if (loading) return <LoadingState message="Loading sessions..." />;
  if (error) return <ErrorState message={error.message} onRetry={fetchSessions} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-display">Active Sessions</h2>
        <p className="text-sm text-[var(--text-secondary)]">Manage devices that are currently logged into your account.</p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="No active sessions" message="You don't have any active sessions." />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{session.userAgent || "Unknown Device"}</h3>
                  {session.isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-sm text-[var(--text-secondary)] mt-1 space-x-3">
                  <span>IP: {session.ip || "Unknown"}</span>
                  <span>•</span>
                  <span>Active: {new Date(session.lastActive).toLocaleString()}</span>
                </div>
              </div>
              
              {!session.isCurrent && (
                <button
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoking === session.id}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  {revoking === session.id ? "Revoking..." : "Revoke"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
