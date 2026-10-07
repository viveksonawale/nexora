"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import { Plus, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrganizationDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/organizations/${slug}`)
      .then((data) => setOrg(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingState message="Loading organization..." />;
  
  if (error || !org) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Failed to load organization.</div>
        <button onClick={() => router.push("/dashboard")} className="text-[var(--text-secondary)] hover:text-orange-500">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const hackathons = org.hackathons || [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-[var(--border)]">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">
            {org.name}
          </h1>
          <div className="flex items-center gap-4 text-sm font-sans text-[var(--text-secondary)]">
            <span>{org.type}</span>
            {org.city && org.country && (
              <>
                <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                <span>{org.city}, {org.country}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl font-sans font-medium transition-colors">
            <Users size={16} />
            Members
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl font-sans font-medium transition-colors">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">
          Hackathons
        </h2>
        <Link
          href={`/dashboard/organizations/${org.slug}/hackathons/create`}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-sans font-medium transition-colors"
        >
          <Plus size={16} />
          Create Hackathon
        </Link>
      </div>

      {hackathons.length === 0 ? (
        <div className="p-12 text-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="text-[var(--text-secondary)] font-sans mb-4">
            No hackathons have been created in this organization yet.
          </div>
          <Link
            href={`/dashboard/organizations/${org.slug}/hackathons/create`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-sans font-semibold transition-colors"
          >
            Create Your First Hackathon
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {hackathons.map((hackathon: any) => (
            <Link
              key={hackathon.id}
              href={`/dashboard/hackathons/${hackathon.id}`}
              className="flex items-center justify-between p-6 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500/50 rounded-2xl transition-colors group"
            >
              <div>
                <h3 className="text-lg font-display font-bold text-[var(--text-primary)] mb-1">
                  {hackathon.title}
                </h3>
                <div className="text-sm font-sans text-[var(--text-secondary)]">
                  {hackathon.status} • {new Date(hackathon.startsAt).toLocaleDateString()}
                </div>
              </div>
              <div className="px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans font-medium text-[var(--text-primary)] group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors">
                Manage
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
