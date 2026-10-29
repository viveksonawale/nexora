"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";
import { NorButton } from "@/components/ui/nor-button";
import {
  Trophy,
  ArrowUpRight,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  RefreshCw,
} from "lucide-react";

interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
}

interface HackathonItem {
  id: string;
  title: string;
  slug: string;
  mode: string;
  status: string;
  tagline?: string | null;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  organizationId: string;
  organization?: OrganizationInfo;
  _count?: {
    registrations: number;
    teams: number;
    submissions: number;
  };
}

export default function AdminHackathonsPage() {
  const { user: currentUser } = useSession();
  const isSuperAdmin = currentUser?.platformRole === "SUPER_ADMIN";

  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Hackathon State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    organizationId: "",
    tagline: "",
    description: "",
    mode: "ONLINE",
    startsAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    maxTeamSize: 4,
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit Hackathon State
  const [editingHackathon, setEditingHackathon] = useState<HackathonItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    tagline: "",
    description: "",
    mode: "ONLINE",
    status: "DRAFT",
    startsAt: "",
    endsAt: "",
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Hackathon State
  const [deletingHackathon, setDeletingHackathon] = useState<HackathonItem | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<HackathonItem[]>("/admin/hackathons");
      setHackathons(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load hackathons");
    }

    try {
      const orgs = await apiFetch<OrganizationInfo[]>("/admin/organizations");
      setOrganizations(orgs || []);
      if (orgs && orgs.length > 0 && !createForm.organizationId) {
        setCreateForm((prev) => ({ ...prev, organizationId: orgs[0].id }));
      }
    } catch (err: any) {
      console.warn("Could not load organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.organizationId) {
      setError("Please select an organization");
      return;
    }
    setSubmittingCreate(true);
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch("/admin/hackathons", {
        method: "POST",
        body: JSON.stringify({
          ...createForm,
          startsAt: new Date(createForm.startsAt).toISOString(),
          endsAt: new Date(createForm.endsAt).toISOString(),
        }),
      });
      setSuccessMsg(`Hackathon "${createForm.title}" created successfully.`);
      setIsCreateOpen(false);
      setCreateForm({
        title: "",
        organizationId: organizations[0]?.id || "",
        tagline: "",
        description: "",
        mode: "ONLINE",
        startsAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        endsAt: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
        maxTeamSize: 4,
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to create hackathon");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const openEditModal = (h: HackathonItem) => {
    setEditingHackathon(h);
    setEditForm({
      title: h.title,
      tagline: h.tagline || "",
      description: h.description || "",
      mode: h.mode,
      status: h.status,
      startsAt: new Date(h.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(h.endsAt).toISOString().slice(0, 16),
    });
  };

  const handleEditHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHackathon) return;
    setSubmittingEdit(true);
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/admin/hackathons/${editingHackathon.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...editForm,
          startsAt: editForm.startsAt ? new Date(editForm.startsAt).toISOString() : undefined,
          endsAt: editForm.endsAt ? new Date(editForm.endsAt).toISOString() : undefined,
        }),
      });
      setSuccessMsg(`Hackathon "${editForm.title}" updated successfully.`);
      setEditingHackathon(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update hackathon");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleStatusChange = async (hackathonId: string, newStatus: string) => {
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/admin/hackathons/${hackathonId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMsg(`Hackathon status set to ${newStatus}.`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to change status");
    }
  };

  const handleDeleteHackathon = async () => {
    if (!deletingHackathon) return;
    setSubmittingDelete(true);
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/admin/hackathons/${deletingHackathon.id}`, {
        method: "DELETE",
      });
      setSuccessMsg(`Hackathon "${deletingHackathon.title}" deleted permanently.`);
      setDeletingHackathon(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete hackathon");
    } finally {
      setSubmittingDelete(false);
    }
  };

  const filtered = hackathons.filter((h) => {
    const matchesSearch =
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading hackathons from database..." />;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Hackathons Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Full administrative control: create, inspect, update lifecycle statuses, and manage hackathons.
          </p>
        </div>

        {isSuperAdmin && (
          <NorButton
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create New Hackathon</span>
          </NorButton>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="text-xs font-bold underline hover:opacity-80 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check size={16} />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by hackathon title or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-[#F97316] text-white"
                  : "bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Hackathons Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--bg-canvas)]/40 border-b border-[var(--border)] text-[var(--text-secondary)] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Hackathon</th>
                <th className="px-6 py-4 font-semibold">Organization</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Mode</th>
                <th className="px-6 py-4 font-semibold">Registrations</th>
                <th className="px-6 py-4 font-semibold">Teams</th>
                <th className="px-6 py-4 font-semibold">Submissions</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-xs text-[var(--text-secondary)]"
                  >
                    No hackathons match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-[var(--bg-canvas)]/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#F97316] border border-orange-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                          <Trophy size={15} />
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">
                            {h.title}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                            {h.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                      {h.organization?.name || "Independent"}
                    </td>
                    <td className="px-6 py-4">
                      {isSuperAdmin ? (
                        <select
                          value={h.status}
                          onChange={(e) => handleStatusChange(h.id, e.target.value)}
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide border cursor-pointer ${
                            h.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : h.status === "DRAFT"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700"
                          }`}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="PAUSED">PAUSED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide ${
                            h.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}
                        >
                          {h.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)] text-xs font-mono">
                      {h.mode}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">
                      {h._count?.registrations ?? 0}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">
                      {h._count?.teams ?? 0}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">
                      {h._count?.submissions ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/hackathons/${h.slug}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#F97316] bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                        >
                          <span>View</span>
                          <ArrowUpRight size={13} />
                        </Link>

                        {isSuperAdmin && (
                          <>
                            <NorButton
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(h)}
                              title="Edit hackathon details"
                            >
                              <Edit3 size={12} />
                              <span>Edit</span>
                            </NorButton>

                            <NorButton
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:border-red-500/40"
                              onClick={() => setDeletingHackathon(h)}
                              title="Delete hackathon permanently"
                            >
                              <Trash2 size={12} />
                            </NorButton>
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

      {/* Modal: Create Hackathon */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="text-orange-500" size={20} />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Create New Hackathon
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateHackathon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Innovation Summit 2026"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Host Organization
                </label>
                {organizations.length === 0 ? (
                  <p className="text-sm text-red-500">
                    No organizations available. Create an organization first.
                  </p>
                ) : (
                  <select
                    value={createForm.organizationId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, organizationId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.slug})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  placeholder="A one-sentence summary of the hackathon"
                  value={createForm.tagline}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, tagline: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Event Mode
                  </label>
                  <select
                    value={createForm.mode}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, mode: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="IN_PERSON">IN_PERSON</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={createForm.maxTeamSize}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        maxTeamSize: parseInt(e.target.value) || 4,
                      })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.startsAt}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, startsAt: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Ends At
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.endsAt}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, endsAt: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  />
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
                  {submittingCreate ? "Creating..." : "Create Hackathon"}
                </NorButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Hackathon */}
      {editingHackathon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="text-orange-500" size={20} />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Edit Hackathon
                </h3>
              </div>
              <button
                onClick={() => setEditingHackathon(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditHackathon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tagline: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Mode
                  </label>
                  <select
                    value={editForm.mode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, mode: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="IN_PERSON">IN_PERSON</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Starts At
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.startsAt}
                    onChange={(e) =>
                      setEditForm({ ...editForm, startsAt: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Ends At
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.endsAt}
                    onChange={(e) =>
                      setEditForm({ ...editForm, endsAt: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <NorButton
                  type="button"
                  variant="outline"
                  onClick={() => setEditingHackathon(null)}
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

      {/* Modal: Delete Hackathon Confirmation */}
      {deletingHackathon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-canvas)] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Delete Hackathon Permanently?
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              You are about to permanently delete{" "}
              <strong className="text-[var(--text-primary)]">
                {deletingHackathon.title}
              </strong>
              . All tracks, criteria, faqs, prizes, registrations, and submissions
              associated with this event will be permanently purged.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <NorButton
                type="button"
                variant="outline"
                onClick={() => setDeletingHackathon(null)}
              >
                Cancel
              </NorButton>
              <NorButton
                type="button"
                variant="primary"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteHackathon}
                disabled={submittingDelete}
              >
                {submittingDelete ? "Deleting..." : "Confirm Delete"}
              </NorButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
