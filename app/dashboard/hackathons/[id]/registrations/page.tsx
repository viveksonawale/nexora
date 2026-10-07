"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { Check, X, Clock, Search, MoreVertical } from "lucide-react";

export default function RegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRegistrations = () => {
    setLoading(true);
    let url = `/hackathons/${id}/registrations`;
    if (filter !== "ALL") url += `?status=${filter}`;
    
    apiFetch(url)
      .then((data: any) => setRegistrations(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRegistrations();
  }, [id, filter]);

  const handleUpdateStatus = async (regId: string, status: string) => {
    setUpdating(regId);
    try {
      // Bulk update route is more reliable to assume if single doesn't exist, but let's try bulk since it takes an array of ids.
      await apiFetch(`/hackathons/${id}/registrations/bulk-status`, {
        method: "PATCH",
        body: JSON.stringify({ ids: [regId], status }),
      });
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const filteredData = registrations.filter(r => 
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && registrations.length === 0) return <LoadingState message="Loading registrations..." />;

  const statusColors: any = {
    APPROVED: "bg-green-500/10 text-green-500",
    PENDING: "bg-orange-500/10 text-orange-500",
    WAITLISTED: "bg-blue-500/10 text-blue-500",
    REJECTED: "bg-red-500/10 text-red-500",
    WITHDRAWN: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">
          Registrations
        </h1>
        <p className="text-[var(--text-secondary)] font-sans">
          Review, approve, and manage attendees.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--bg-elevated)] p-4 border border-[var(--border)] rounded-2xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left font-sans">
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Participant</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Registered</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                  No registrations found.
                </td>
              </tr>
            ) : (
              filteredData.map(reg => (
                <tr key={reg.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--border)] overflow-hidden">
                        {reg.user?.profile?.avatarUrl ? (
                          <img src={reg.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[var(--text-secondary)]">
                            {reg.user?.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{reg.user?.name}</div>
                        <div className="text-sm text-[var(--text-secondary)]">{reg.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${statusColors[reg.status] || statusColors.PENDING}`}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {updating === reg.id ? (
                        <span className="text-sm text-[var(--text-secondary)]">Updating...</span>
                      ) : (
                        <>
                          {(reg.status === "PENDING" || reg.status === "WAITLISTED") && (
                            <button
                              onClick={() => handleUpdateStatus(reg.id, "APPROVED")}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors tooltip-trigger"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          {(reg.status === "PENDING" || reg.status === "WAITLISTED") && (
                            <button
                              onClick={() => handleUpdateStatus(reg.id, "REJECTED")}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors tooltip-trigger"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          )}
                          {reg.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateStatus(reg.id, "WAITLISTED")}
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors tooltip-trigger"
                              title="Waitlist"
                            >
                              <Clock size={18} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
