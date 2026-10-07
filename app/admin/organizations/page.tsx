"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import { Building2, CheckCircle2, XCircle } from "lucide-react";

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/organizations");
      setOrgs(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/admin/organizations/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update");
    }
  };

  if (loading) return <LoadingState message="Loading organizations..." />;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Organizations</h1>
          <p className="text-[var(--text-secondary)] font-sans mt-2">
            Review and approve organizer applications.
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
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Organization</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {orgs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                  No organizations found.
                </td>
              </tr>
            ) : (
              orgs.map((org: any) => (
                <tr key={org.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] flex items-center justify-center overflow-hidden">
                        {org.logoUrl ? (
                          <img src={org.logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={20} className="text-[var(--text-secondary)]" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{org.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{org.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      org.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                      org.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                      org.status === 'SUSPENDED' ? 'bg-gray-500/10 text-gray-500' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      {org.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                    {org.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleUpdateStatus(org.id, "APPROVED")} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors">
                          <CheckCircle2 size={18} />
                        </button>
                        <button onClick={() => handleUpdateStatus(org.id, "REJECTED")} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                    {org.status === 'APPROVED' && (
                      <button onClick={() => handleUpdateStatus(org.id, "SUSPENDED")} className="text-xs font-bold px-3 py-1.5 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        Suspend
                      </button>
                    )}
                    {org.status === 'SUSPENDED' && (
                      <button onClick={() => handleUpdateStatus(org.id, "APPROVED")} className="text-xs font-bold px-3 py-1.5 border border-green-500/20 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors">
                        Reactivate
                      </button>
                    )}
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
