"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import {
  Plus,
  Building2,
  ChevronRight,
  Shield,
  LifeBuoy,
  Gavel,
  Trophy,
  Users,
  Compass,
  ArrowRight,
} from "lucide-react";
import { NorButton } from "@/components/ui/nor-button";

export default function DashboardPage() {
  const { user } = useSession();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/organizations")
      .then((data) => setOrgs(data as any[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading your workspace..." />;

  const isSuperAdmin = user?.platformRole === "SUPER_ADMIN";
  const isSupportAdmin = user?.platformRole === "SUPPORT_ADMIN";
  const staffRoles = user?.staffRoles || [];
  const judgeRoles = staffRoles.filter(
    (s) => s.role === "JUDGE" || s.role === "HEAD_JUDGE"
  );
  const otherStaffRoles = staffRoles.filter(
    (s) => s.role !== "JUDGE" && s.role !== "HEAD_JUDGE"
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 font-sans">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
          Welcome back, {user?.name || "Builder"}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Access your active role workspaces, organizations, and event responsibilities.
        </p>
      </div>

      {/* Role Workspaces Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Super Admin Workspace Card */}
        {isSuperAdmin && (
          <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-3">
                <Shield size={20} />
              </div>
              <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">
                Super Admin Console
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Full platform governance, role assignment, system health, and audit logs.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center text-sm font-semibold text-red-500 hover:text-red-600 gap-1"
            >
              Enter Admin Portal <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Platform Support Workspace Card */}
        {(isSupportAdmin || isSuperAdmin) && (
          <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <LifeBuoy size={20} />
              </div>
              <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">
                Support Admin Console
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                User support queue, verification assistance, and operational diagnostics.
              </p>
            </div>
            <Link
              href="/admin/support"
              className="inline-flex items-center text-sm font-semibold text-blue-500 hover:text-blue-600 gap-1"
            >
              Open Support Queue <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Judging Workspace Card */}
        {judgeRoles.length > 0 && (
          <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <Gavel size={20} />
              </div>
              <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">
                Judge Portal ({judgeRoles.length} Events)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Review assigned submissions, enter scores, and submit rubric evaluations.
              </p>
            </div>
            <Link
              href="/judge/assignments"
              className="inline-flex items-center text-sm font-semibold text-amber-500 hover:text-amber-600 gap-1"
            >
              Go to Evaluations <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Student Dashboard Card */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-3">
              <Compass size={20} />
            </div>
            <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">
              Student Dashboard
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Personalized dashboard for your hackathon journey, teams, invitations, resume, and certificates.
            </p>
          </div>
          <Link
            href="/student"
            className="inline-flex items-center text-sm font-semibold text-orange-500 hover:text-orange-600 gap-1"
          >
            Open Student Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Assigned Staff Events (if any) */}
      {otherStaffRoles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">
            Active Event Assignments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherStaffRoles.map((s, idx) => (
              <div
                key={idx}
                className="p-5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      {s.role}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {s.hackathon?.title || "Hackathon"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Manage delegated responsibilities for this event.
                  </p>
                </div>
                <Link
                  href={`/dashboard/hackathons/${s.hackathonId}/overview`}
                  className="text-xs font-semibold text-orange-500 hover:underline flex items-center"
                >
                  Manage <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organizations Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">
              Organizations
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Host hackathons, manage university or enterprise chapters, and invite co-organizers.
            </p>
          </div>
          <Link
            href="/dashboard/organizations/create"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-orange-500/50 text-[var(--text-primary)] rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Organization
          </Link>
        </div>

        {orgs.length === 0 ? (
          <div className="p-8 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl text-center">
            <Building2 size={36} className="text-orange-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              No Organizations Yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 mb-4">
              Create an organization to host hackathons, assemble team staff, and coordinate sponsor tiers.
            </p>
            <Link
              href="/dashboard/organizations/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              Create Organization
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map((org) => (
              <Link
                key={org.id}
                href={`/dashboard/organizations/${org.slug}`}
                className="group block p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Building2 className="text-orange-500" size={24} />
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-[var(--text-secondary)]">
                    {org.myRole}
                  </span>
                </div>

                <h3 className="text-lg font-display font-bold text-[var(--text-primary)] mb-1">
                  {org.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                  {org.description || "No description provided."}
                </p>

                <div className="mt-5 flex items-center text-xs font-semibold text-orange-500 group-hover:translate-x-1 transition-transform">
                  Manage Organization
                  <ChevronRight size={14} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
