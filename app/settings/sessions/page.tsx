"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { 
  Laptop, 
  Smartphone, 
  Monitor, 
  Globe, 
  ShieldCheck, 
  Clock, 
  Trash2, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

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
    if (!confirm("Are you sure you want to log out this device?")) return;
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

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Laptop;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) {
      return Smartphone;
    }
    if (ua.includes("macintosh") || ua.includes("mac os") || ua.includes("windows") || ua.includes("linux")) {
      return Laptop;
    }
    return Monitor;
  };

  const getDeviceTitle = (userAgent?: string) => {
    if (!userAgent) return "Unknown Browser & Device";
    let browser = "Browser";
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Edg")) browser = "Edge";

    let os = "Device";
    if (userAgent.includes("Mac OS")) os = "macOS";
    else if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

    return `${browser} on ${os}`;
  };

  if (loading) return <LoadingState message="Loading active sessions..." />;
  if (error) return <ErrorState message={error.message} onRetry={fetchSessions} />;

  return (
    <div className="space-y-6 max-w-3xl font-sans">
      <div className="pb-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2.5">
            <Laptop size={20} className="text-[#F97316]" />
            Active Device Sessions ({sessions.length})
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Devices that are currently logged in with your Nexora credentials.
          </p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-canvas)]/40 space-y-2">
          <ShieldCheck size={28} className="mx-auto text-[var(--text-secondary)] opacity-50" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            No active sessions found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const Icon = getDeviceIcon(session.userAgent);
            const title = getDeviceTitle(session.userAgent);

            return (
              <div
                key={session.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  session.isCurrent
                    ? "bg-[var(--bg-canvas)] border-[#F97316]/40 shadow-xs"
                    : "bg-[var(--bg-canvas)] border-[var(--border)] hover:border-[#F97316]/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      session.isCurrent
                        ? "bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]"
                        : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] font-display">
                        {title}
                      </h3>
                      {session.isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          This Device
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Globe size={11} className="text-[#F97316]" />
                        <span>IP: {session.ip || "127.0.0.1"}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock size={11} />
                        <span>Last active: {new Date(session.lastActive).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={revoking === session.id}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/40 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                    <span>{revoking === session.id ? "Revoking..." : "Revoke Access"}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
