"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { NorButton } from "@/components/ui/nor-button";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Mail,
  ArrowLeft,
  X,
  Check,
  UserCheck,
} from "lucide-react";

interface StaffMember {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profile?: {
      avatarUrl?: string | null;
    } | null;
  } | null;
}

const EVENT_STAFF_ROLES = [
  { value: "JUDGE", label: "Judge" },
  { value: "HEAD_JUDGE", label: "Head Judge" },
  { value: "CO_ORGANIZER", label: "Co-organizer" },
  { value: "ORGANIZER", label: "Event Organizer" },
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

export default function HackathonStaffRolesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Invite/Assign Modal state
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("JUDGE");
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<StaffMember[]>(`/hackathons/${id}/staff`);
      setStaff(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [id]);

  const handleAssignOrInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      await apiFetch(`/hackathons/${id}/staff`, {
        method: "POST",
        body: JSON.stringify({
          email: emailInput.trim(),
          role: selectedRole,
        }),
      });

      setSuccessMsg(`Role ${selectedRole} assigned to ${emailInput}.`);
      setEmailInput("");
      setShowModal(false);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message || "Failed to assign staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (staffId: string, role: string) => {
    if (!confirm(`Are you sure you want to revoke this ${role} role?`)) return;

    setError("");
    setSuccessMsg("");

    try {
      await apiFetch(`/hackathons/${id}/staff/${staffId}`, {
        method: "DELETE",
      });
      setSuccessMsg(`Revoked ${role} assignment.`);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message || "Failed to remove staff member");
    }
  };

  if (loading) return <LoadingState message="Loading event staff and roles..." />;

  const judges = staff.filter((s) => s.role === "JUDGE" || s.role === "HEAD_JUDGE");
  const organizers = staff.filter((s) => s.role === "ORGANIZER" || s.role === "CO_ORGANIZER");
  const mentors = staff.filter((s) => s.role === "MENTOR");
  const operations = staff.filter(
    (s) =>
      s.role !== "JUDGE" &&
      s.role !== "HEAD_JUDGE" &&
      s.role !== "ORGANIZER" &&
      s.role !== "CO_ORGANIZER" &&
      s.role !== "MENTOR"
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/hackathons/${id}/overview`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-orange-500 mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Hackathon Overview
          </Link>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Event Staff & Role Assignments
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Delegate responsibilities to Judges, Mentors, Co-organizers, Registration Managers, and Event Operations.
          </p>
        </div>

        <NorButton onClick={() => setShowModal(true)}>
          <Plus size={16} className="mr-1.5" />
          Assign Staff Member
        </NorButton>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check size={16} />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Judges & Head Judges
          </div>
          <div className="text-2xl font-display font-bold text-amber-500 mt-1">
            {judges.length}
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Organizers
          </div>
          <div className="text-2xl font-display font-bold text-orange-500 mt-1">
            {organizers.length}
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Mentors
          </div>
          <div className="text-2xl font-display font-bold text-blue-500 mt-1">
            {mentors.length}
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Ops & Volunteers
          </div>
          <div className="text-2xl font-display font-bold text-emerald-500 mt-1">
            {operations.length}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
            Assigned Personnel ({staff.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-[var(--bg-elevated)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Staff Member
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Role
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Assigned Date
                </th>
                <th className="px-6 py-3.5 text-xs font-bold text-[var(--text-secondary)] uppercase text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    No staff members assigned yet. Use the button above to assign Judges, Mentors, or Co-organizers.
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-elevated)]/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                          {s.user?.name ? s.user.name.charAt(0) : s.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">
                            {s.user?.name || "Pending User"}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] font-mono">
                            {s.user?.email || s.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
                          s.role === "JUDGE" || s.role === "HEAD_JUDGE"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : s.role === "ORGANIZER" || s.role === "CO_ORGANIZER"
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-[var(--text-secondary)]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(s.id, s.role)}
                        title="Revoke Assignment"
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Users className="text-orange-500" size={20} />
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  Assign or Invite Staff Member
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignOrInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  User Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="judge@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  If the user already has an account, the role is activated immediately. Otherwise an invitation is recorded.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Assigned Event Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                >
                  {EVENT_STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <NorButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </NorButton>

                <NorButton type="submit" disabled={submitting}>
                  {submitting ? "Assigning..." : "Assign Role"}
                </NorButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
