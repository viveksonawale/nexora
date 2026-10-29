"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";
import { NorButton } from "@/components/ui/nor-button";
import {
  ShieldAlert,
  UserCheck,
  Search,
  PlusCircle,
  X,
  XCircle,
  Trophy,
  Check,
  Edit3,
  Trash2,
  UserPlus,
  RefreshCw,
} from "lucide-react";

interface UserProfile {
  avatarUrl?: string | null;
  headline?: string | null;
}

interface HackathonInfo {
  id: string;
  title: string;
  slug: string;
}

interface StaffRoleInfo {
  id: string;
  hackathonId: string;
  role: string;
  status: string;
  hackathon: HackathonInfo;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  platformRole: "USER" | "SUPER_ADMIN" | "SUPPORT_ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  profile?: UserProfile | null;
  staffRoles?: StaffRoleInfo[];
}

const AVAILABLE_STAFF_ROLES = [
  { value: "JUDGE", label: "Judge" },
  { value: "ORGANIZER", label: "Event Organizer" },
  { value: "CO_ORGANIZER", label: "Co-organizer" },
  { value: "HEAD_JUDGE", label: "Head Judge" },
  { value: "REGISTRATION_MANAGER", label: "Registration Manager" },
  { value: "EVENT_OPS", label: "Event Operations" },
  { value: "SUBMISSION_REVIEWER", label: "Submission Reviewer" },
  { value: "MENTOR", label: "Mentor" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "SPONSOR_REP", label: "Sponsor Representative" },
  { value: "PRIZE_MANAGER", label: "Prize Manager" },
  { value: "COMMUNICATIONS_MANAGER", label: "Communications Manager" },
  { value: "AUDITOR", label: "Auditor" },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useSession();
  const isSuperAdmin = currentUser?.platformRole === "SUPER_ADMIN";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [hackathons, setHackathons] = useState<HackathonInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Role Assignment Modal State
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedHackathonId, setSelectedHackathonId] = useState("");
  const [selectedRole, setSelectedRole] = useState("JUDGE");
  const [submittingRole, setSubmittingRole] = useState(false);

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    platformRole: "USER" as "USER" | "SUPER_ADMIN" | "SUPPORT_ADMIN",
    status: "ACTIVE" as "ACTIVE" | "SUSPENDED",
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    platformRole: "USER" as "USER" | "SUPER_ADMIN" | "SUPPORT_ADMIN",
    status: "ACTIVE" as "ACTIVE" | "SUSPENDED",
    headline: "",
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete User Modal State
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const usersData = await apiFetch<UserRecord[]>("/admin/users");
      setUsers(usersData || []);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    }

    try {
      const hackathonsData = await apiFetch<any[]>("/admin/hackathons");
      setHackathons(hackathonsData || []);
    } catch (err: any) {
      console.warn("Could not load hackathons for role assignment modal:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setSuccessMsg(`User ${createForm.name} created successfully.`);
      setIsCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        platformRole: "USER",
        status: "ACTIVE",
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      platformRole: u.platformRole,
      status: u.status,
      headline: u.profile?.headline || "",
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmittingEdit(true);
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/admin/users/${editingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setSuccessMsg(`User ${editForm.name} updated successfully.`);
      setEditingUser(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setSubmittingDelete(true);
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      setSuccessMsg(`User ${deletingUser.name} deleted successfully.`);
      setDeletingUser(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/admin/users/${id}/${newStatus.toLowerCase()}`, {
        method: "POST",
      });
      setSuccessMsg(`User status updated to ${newStatus}.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    }
  };

  const handleUpdatePlatformRole = async (
    id: string,
    newRole: "USER" | "SUPER_ADMIN" | "SUPPORT_ADMIN"
  ) => {
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/admin/users/${id}/platform-role`, {
        method: "POST",
        body: JSON.stringify({ platformRole: newRole }),
      });
      setSuccessMsg(`Platform role changed to ${newRole}.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update platform role");
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedHackathonId || !selectedRole) return;

    setSubmittingRole(true);
    setError("");
    setSuccessMsg("");

    try {
      await apiFetch("/admin/users/assign-role", {
        method: "POST",
        body: JSON.stringify({
          userId: selectedUser.id,
          hackathonId: selectedHackathonId,
          role: selectedRole,
        }),
      });

      setSuccessMsg(
        `Assigned ${selectedRole} role to ${selectedUser.name} successfully.`
      );
      setSelectedUser(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to assign role");
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleRevokeRole = async (
    userId: string,
    hackathonId: string,
    role: string,
    staffId: string
  ) => {
    if (!confirm(`Revoke ${role} role for this user?`)) return;

    setError("");
    setSuccessMsg("");
    try {
      await apiFetch("/admin/users/revoke-role", {
        method: "POST",
        body: JSON.stringify({
          userId,
          hackathonId,
          role,
          staffId,
        }),
      });
      setSuccessMsg(`Revoked ${role} role successfully.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to revoke role");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.platformRole.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (roleFilter === "ALL") return true;
    if (roleFilter === "SUPER_ADMIN") return u.platformRole === "SUPER_ADMIN";
    if (roleFilter === "SUPPORT_ADMIN") return u.platformRole === "SUPPORT_ADMIN";
    if (roleFilter === "JUDGE")
      return u.staffRoles?.some((r) => r.role === "JUDGE" || r.role === "HEAD_JUDGE");
    if (roleFilter === "ORGANIZER")
      return u.staffRoles?.some((r) => r.role === "ORGANIZER" || r.role === "CO_ORGANIZER");

    return true;
  });

  if (loading) return <LoadingState message="Loading users and role matrix..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Users & Access Control
          </h1>
          <p className="text-[var(--text-secondary)] font-sans mt-1">
            Full administrative control: create, inspect, update, assign roles, and manage users.
          </p>
        </div>

        {isSuperAdmin && (
          <NorButton
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus size={16} />
            <span>Add New User</span>
          </NorButton>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-sans flex items-center justify-between">
          <span>{error}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="text-xs font-bold underline hover:opacity-80 flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Retry
            </button>
            <button onClick={() => setError("")} className="text-red-500 hover:opacity-80 ml-2">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-sans flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check size={16} />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
            Filter:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs font-sans text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Accounts</option>
            <option value="SUPER_ADMIN">Platform Super Admins</option>
            <option value="SUPPORT_ADMIN">Platform Support Admins</option>
            <option value="ORGANIZER">Event Organizers</option>
            <option value="JUDGE">Judges</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-canvas)]/50 border-b border-[var(--border)] text-[var(--text-secondary)] text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Platform Role</th>
                <th className="px-6 py-4">Assigned Hackathon Roles</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Manage Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[var(--text-secondary)]"
                  >
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--bg-canvas)]/40 transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center font-bold text-sm shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">
                              {u.name}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] font-mono">
                              {u.email}
                            </div>
                            {u.profile?.headline && (
                              <div className="text-[11px] text-[var(--text-secondary)] italic mt-0.5">
                                {u.profile.headline}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Platform Role Selector */}
                      <td className="px-6 py-4">
                        {isSuperAdmin ? (
                          <select
                            value={u.platformRole}
                            onChange={(e) =>
                              handleUpdatePlatformRole(
                                u.id,
                                e.target.value as
                                  | "USER"
                                  | "SUPER_ADMIN"
                                  | "SUPPORT_ADMIN"
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                              u.platformRole === "SUPER_ADMIN"
                                ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                : u.platformRole === "SUPPORT_ADMIN"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                : "bg-[var(--bg-canvas)] text-[var(--text-secondary)] border-[var(--border)]"
                            }`}
                          >
                            <option value="USER">User</option>
                            <option value="SUPPORT_ADMIN">Support Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              u.platformRole === "SUPER_ADMIN"
                                ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                : u.platformRole === "SUPPORT_ADMIN"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                : "bg-[var(--bg-canvas)] text-[var(--text-secondary)] border-[var(--border)]"
                            }`}
                          >
                            {u.platformRole}
                          </span>
                        )}
                      </td>

                      {/* Assigned Event Roles */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {u.staffRoles && u.staffRoles.length > 0 ? (
                            u.staffRoles.map((role) => (
                              <span
                                key={role.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-200"
                              >
                                <span className="font-semibold">{role.role}</span>
                                {role.hackathon && (
                                  <span className="text-zinc-400 text-[11px]">
                                    ({role.hackathon.title})
                                  </span>
                                )}
                                {isSuperAdmin && (
                                  <button
                                    onClick={() =>
                                      handleRevokeRole(
                                        u.id,
                                        role.hackathonId,
                                        role.role,
                                        role.id
                                      )
                                    }
                                    title="Revoke Role"
                                    className="text-zinc-400 hover:text-red-400 transition-colors ml-0.5"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--text-secondary)] italic">
                              No event roles assigned
                            </span>
                          )}

                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                if (hackathons.length > 0) {
                                  setSelectedHackathonId(hackathons[0].id);
                                }
                              }}
                              className="text-xs text-orange-500 hover:text-orange-400 underline font-medium ml-1"
                            >
                              + Assign
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.status === "SUSPENDED"
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-end gap-2">
                            <NorButton
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(u)}
                              title="Edit user details"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </NorButton>

                            <NorButton
                              variant={u.status === "SUSPENDED" ? "primary" : "outline"}
                              className={
                                u.status === "SUSPENDED"
                                  ? ""
                                  : "text-amber-500 hover:text-amber-400 hover:border-amber-500/40"
                              }
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(
                                  u.id,
                                  u.status === "SUSPENDED" ? "REACTIVATE" : "SUSPEND"
                                )
                              }
                            >
                              {u.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                            </NorButton>

                            <NorButton
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:border-red-500/40"
                              onClick={() => setDeletingUser(u)}
                              title="Delete user permanently"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </NorButton>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)] italic">
                            Read only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="text-orange-500" size={20} />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Add New User
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Platform Role
                  </label>
                  <select
                    value={createForm.platformRole}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        platformRole: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    <option value="USER">User</option>
                    <option value="SUPPORT_ADMIN">Support Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <NorButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </NorButton>
                <NorButton type="submit" disabled={submittingCreate}>
                  {submittingCreate ? "Creating..." : "Create User"}
                </NorButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="text-orange-500" size={20} />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Edit User Details
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Headline / Bio Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full-stack Developer"
                  value={editForm.headline}
                  onChange={(e) =>
                    setEditForm({ ...editForm, headline: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Platform Role
                  </label>
                  <select
                    value={editForm.platformRole}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        platformRole: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    <option value="USER">User</option>
                    <option value="SUPPORT_ADMIN">Support Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <NorButton
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </NorButton>
                <NorButton type="submit" disabled={submittingEdit}>
                  {submittingEdit ? "Saving..." : "Save Changes"}
                </NorButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete User Confirmation */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-canvas)] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Delete User Permanently?
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  This action is irreversible.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              You are about to permanently delete{" "}
              <strong className="text-[var(--text-primary)]">
                {deletingUser.name}
              </strong>{" "}
              ({deletingUser.email}). All sessions, tokens, and direct associations
              will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <NorButton
                type="button"
                variant="outline"
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </NorButton>
              <NorButton
                type="button"
                variant="primary"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteUser}
                disabled={submittingDelete}
              >
                {submittingDelete ? "Deleting..." : "Confirm Delete"}
              </NorButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Direct Role Assignment */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="text-orange-500" size={20} />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Assign Hackathon Role
                </h3>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Selected User
                </label>
                <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-sm">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {selectedUser.name}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] font-mono">
                      {selectedUser.email}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Select Hackathon
                </label>
                {hackathons.length === 0 ? (
                  <p className="text-sm text-red-500">
                    No hackathons available. Create a hackathon first.
                  </p>
                ) : (
                  <select
                    value={selectedHackathonId}
                    onChange={(e) => setSelectedHackathonId(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    {hackathons.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Role Assignment
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                >
                  {AVAILABLE_STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  The user will immediately gain all permissions associated with this role in the chosen hackathon.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <NorButton
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Cancel
                </NorButton>

                <NorButton
                  type="submit"
                  disabled={submittingRole || hackathons.length === 0}
                >
                  {submittingRole ? "Assigning..." : "Confirm Role Assignment"}
                </NorButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
