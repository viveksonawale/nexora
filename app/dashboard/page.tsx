"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import { Plus, Building2, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/organizations")
      .then((data) => setOrgs(data as any[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading your organizations..." />;

  if (orgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
          <Building2 size={32} className="text-orange-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-2">
          No Organizations Yet
        </h2>
        <p className="text-[var(--text-secondary)] font-sans max-w-md mb-8">
          You aren't a part of any organizations. Create one to start hosting hackathons, managing teams, and inviting members.
        </p>
        <Link
          href="/dashboard/organizations/create"
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-sans font-semibold transition-colors"
        >
          <Plus size={18} />
          Create Organization
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Organizations
          </h1>
          <p className="text-[var(--text-secondary)] font-sans mt-1">
            Manage your organizations and switch contexts.
          </p>
        </div>
        <Link
          href="/dashboard/organizations/create"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-orange-500/50 text-[var(--text-primary)] rounded-xl font-sans font-medium transition-colors"
        >
          <Plus size={16} />
          New Organization
        </Link>
      </div>

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
              <span className="text-xs font-sans font-medium px-2 py-1 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-md text-[var(--text-secondary)]">
                {org.myRole}
              </span>
            </div>
            
            <h3 className="text-lg font-display font-bold text-[var(--text-primary)] mb-1">
              {org.name}
            </h3>
            <p className="text-sm font-sans text-[var(--text-secondary)] line-clamp-2">
              {org.description || "No description provided."}
            </p>
            
            <div className="mt-6 flex items-center text-sm font-sans font-medium text-orange-500 group-hover:translate-x-1 transition-transform">
              Manage Organization
              <ChevronRight size={16} className="ml-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
