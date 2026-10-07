"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { Shield, ShieldAlert, UserIcon, ShieldCheck } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/users");
      setUsers(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`/admin/users/${id}/${newStatus.toLowerCase()}`, {
        method: "POST",
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update user");
    }
  };

  if (loading) return <LoadingState message="Loading users..." />;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-[var(--text-secondary)] font-sans mt-2">
            Manage user accounts across the platform.
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
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Joined</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u: any) => (
                <tr key={u.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-canvas)] border border-[var(--border)] flex items-center justify-center overflow-hidden font-display font-bold text-[var(--text-secondary)]">
                        {u.profile?.avatarUrl ? (
                          <img src={u.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{u.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      {u.role === 'SUPERADMIN' ? <ShieldAlert size={16} className="text-red-500" /> : <UserIcon size={16} className="text-[var(--text-secondary)]" />}
                      <span className={u.role === 'SUPERADMIN' ? 'text-red-500 font-bold' : 'text-[var(--text-secondary)]'}>
                        {u.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      u.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== 'SUPERADMIN' && (
                      <button
                        onClick={() => handleUpdateStatus(u.id, u.status === 'SUSPENDED' ? 'REACTIVATE' : 'SUSPEND')}
                        className={`text-xs font-bold px-3 py-1.5 border rounded-lg transition-colors ${
                          u.status === 'SUSPENDED'
                            ? 'border-green-500/20 text-green-500 hover:bg-green-500/10'
                            : 'border-red-500/20 text-red-500 hover:bg-red-500/10'
                        }`}
                      >
                        {u.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
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
