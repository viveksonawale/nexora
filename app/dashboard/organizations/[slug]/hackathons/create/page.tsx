"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";
import { LoadingState } from "@/components/shared/states";

export default function CreateHackathonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    mode: "OFFLINE",
    startsAt: "",
    endsAt: "",
  });

  useEffect(() => {
    apiFetch(`/organizations/${slug}`)
      .then(setOrg)
      .catch((err) => setError("Failed to load organization"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    
    setSubmitting(true);
    setError("");

    try {
      const created = await apiFetch(`/organizations/${org.id}/hackathons`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          startsAt: new Date(formData.startsAt).toISOString(),
          endsAt: new Date(formData.endsAt).toISOString(),
        }),
      }) as any;
      router.push(`/dashboard/hackathons/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create hackathon");
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading..." />;
  if (!org) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 py-12">
      <Link href={`/dashboard/organizations/${slug}`} className="inline-flex items-center gap-2 text-sm font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors">
        <ArrowLeft size={16} />
        Back to {org.name}
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center">
          <Rocket size={28} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Create Hackathon
          </h1>
          <p className="text-[var(--text-secondary)] font-sans mt-1">
            Set up the basics. You can configure prizes and tracks later.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border)]">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-sans">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Hackathon Title
          </label>
          <input
            required
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="e.g. Nexus Hack 2026"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Event Mode
          </label>
          <select
            value={formData.mode}
            onChange={(e) => setFormData(p => ({ ...p, mode: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="OFFLINE">In-Person</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
              Start Date & Time
            </label>
            <input
              required
              type="datetime-local"
              value={formData.startsAt}
              onChange={(e) => setFormData(p => ({ ...p, startsAt: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
              End Date & Time
            </label>
            <input
              required
              type="datetime-local"
              value={formData.endsAt}
              onChange={(e) => setFormData(p => ({ ...p, endsAt: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-sans font-semibold transition-colors"
        >
          {submitting ? "Creating..." : "Create Hackathon"}
        </button>
      </form>
    </div>
  );
}
