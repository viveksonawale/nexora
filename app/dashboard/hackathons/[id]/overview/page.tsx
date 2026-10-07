"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import { Settings, Users, Activity, CheckCircle, ExternalLink } from "lucide-react";

export default function HackathonOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/hackathons/${id}`)
      .then(setHackathon)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading hackathon dashboard..." />;
  if (!hackathon) return <div className="p-8 text-red-500">Failed to load hackathon.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">
            {hackathon.title}
          </h1>
          <div className="flex items-center gap-3 text-sm font-sans text-[var(--text-secondary)]">
            <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded-md font-medium">
              {hackathon.status}
            </span>
            <span>{new Date(hackathon.startsAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/hackathons/${hackathon.slug || hackathon.id}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl font-sans font-medium transition-colors"
          >
            <ExternalLink size={16} />
            Public Page
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-secondary)]">
            <Users size={20} />
            <h3 className="font-sans font-medium text-sm">Registrations</h3>
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)]">
            0
          </div>
          <div className="text-xs font-sans text-orange-500 mt-2">
            +0 this week
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-secondary)]">
            <Activity size={20} />
            <h3 className="font-sans font-medium text-sm">Submissions</h3>
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)]">
            0
          </div>
          <div className="text-xs font-sans text-[var(--text-secondary)] mt-2">
            Awaiting submissions
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-secondary)]">
            <CheckCircle size={20} />
            <h3 className="font-sans font-medium text-sm">Check-ins</h3>
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)]">
            0
          </div>
          <div className="text-xs font-sans text-[var(--text-secondary)] mt-2">
            0% of registered
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/dashboard/hackathons/${id}/setup`}
            className="flex items-center p-4 border border-[var(--border)] rounded-xl hover:border-orange-500/50 transition-colors group"
          >
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mr-4 text-orange-500">
              <Settings size={20} />
            </div>
            <div>
              <div className="font-sans font-semibold text-[var(--text-primary)] group-hover:text-orange-500 transition-colors">
                Setup Hackathon
              </div>
              <div className="text-sm font-sans text-[var(--text-secondary)]">
                Configure details, prizes, schedules
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
