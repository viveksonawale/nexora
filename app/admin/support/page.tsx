"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { NorButton } from "@/components/ui/nor-button";
import {
  LifeBuoy,
  Users,
  AlertTriangle,
  Mail,
  ShieldCheck,
  Search,
  CheckCircle,
} from "lucide-react";

interface SupportData {
  recentUsers: any[];
  suspendedUsers: any[];
  unverifiedCount: number;
  recentAudits: any[];
}

export default function PlatformSupportAdminPage() {
  const [data, setData] = useState<SupportData>({
    recentUsers: [],
    suspendedUsers: [],
    unverifiedCount: 0,
    recentAudits: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSupportData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiFetch<SupportData>("/admin/support");
      if (res) setData(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load support queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportData();
  }, []);

  const handleReactivate = async (userId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/reactivate`, { method: "POST" });
      setFeedbackMsg("User account reactivated successfully.");
      await fetchSupportData();
    } catch (err: any) {
      alert(err.message || "Failed to reactivate user");
    }
  };

  if (loading) return <LoadingState message="Loading support queue and diagnostics..." />;

  const filteredUsers = (data.recentUsers || []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <LifeBuoy className="text-blue-500" size={26} />
            <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
              Platform Support Admin Console
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] mt-1">
            Troubleshoot account access issues, investigate login hurdles, and review operational audit logs.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={fetchSupportData} className="text-xs font-bold underline hover:opacity-80">
            Retry
          </button>
        </div>
      )}

      {feedbackMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          {feedbackMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <AlertTriangle size={15} className="text-amber-500" />
            Suspended Accounts
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)] mt-2">
            {data.suspendedUsers.length}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Accounts flagged for review
          </div>
        </div>

        <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <Mail size={15} className="text-blue-500" />
            Unverified Accounts
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)] mt-2">
            {data.unverifiedCount}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Awaiting email confirmation
          </div>
        </div>

        <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            <ShieldCheck size={15} className="text-emerald-500" />
            Role Scope Boundary
          </div>
          <div className="text-3xl font-display font-bold text-emerald-500 mt-2">
            Protected
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            No access to judging scores or financial details
          </div>
        </div>
      </div>

      {/* Suspended Accounts Section */}
      {data.suspendedUsers.length > 0 && (
        <div className="bg-[var(--bg-canvas)] border border-red-500/20 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle size={18} />
            Suspended Accounts Awaiting Support Action
          </h2>
          <div className="divide-y divide-[var(--border)]">
            {data.suspendedUsers.map((su) => (
              <div
                key={su.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{su.name}</div>
                  <div className="text-xs text-[var(--text-secondary)] font-mono">{su.email}</div>
                  <div className="text-[11px] text-red-400 mt-0.5">
                    Suspended on: {new Date(su.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <NorButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleReactivate(su.id)}
                  >
                    Reactivate Account
                  </NorButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Search & Permitted Details */}
      <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-display font-bold text-[var(--text-primary)]">
              User Assistance & Verification Queue
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Inspect user status and verification details to assist with account troubleshooting.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
            />
            <input
              type="text"
              placeholder="Filter users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs font-sans text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Verification
                </th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--bg-elevated)]/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[var(--text-primary)]">{u.name}</div>
                    <div className="text-xs text-[var(--text-secondary)] font-mono">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">
                      {u.platformRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.emailVerifiedAt ? (
                      <span className="text-xs text-emerald-500 font-semibold">Verified</span>
                    ) : (
                      <span className="text-xs text-amber-500 font-semibold">Pending Verification</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        u.status === "SUSPENDED"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Logs Section */}
      <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-display font-bold text-[var(--text-primary)]">
          Recent Operational Support Logs
        </h2>
        <div className="divide-y divide-[var(--border)] text-sm">
          {data.recentAudits.slice(0, 10).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-orange-500 mr-2">
                  {log.action}
                </span>
                <span className="text-xs text-[var(--text-primary)]">
                  by {log.actor?.name || log.actor?.email || "System"}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-mono">
                {new Date(log.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
