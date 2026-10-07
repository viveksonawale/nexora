"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { ShinyButton } from "@/app/components/ShinyButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function CreateTeamContent({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lookingForMembers: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch(`/hackathons/${id}/teams`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      router.push(`/hackathons/${id}/teams`);
    } catch (err: any) {
      setError(err.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href={`/hackathons/${id}/teams`} className="inline-flex items-center gap-2 text-sm font-sans font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft size={16} /> Back to Teams
      </Link>

      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8 space-y-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-[var(--text-primary)]">Create a Team</h2>
          <p className="text-[var(--text-secondary)] font-sans mt-1">
            Build your squad. You'll get an invite code to share with your friends.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Team Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Code Ninjas"
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Description (Optional)</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="What is your team planning to build? Who are you looking for?"
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formData.lookingForMembers}
              onChange={e => setFormData(p => ({ ...p, lookingForMembers: e.target.checked }))}
              className="w-5 h-5 rounded border-[var(--border)] text-orange-500 focus:ring-orange-500"
            />
            <div>
              <div className="font-bold text-[var(--text-primary)]">Looking for members</div>
              <div className="text-xs text-[var(--text-secondary)]">Your team will be listed publicly so others can request to join.</div>
            </div>
          </label>

          <ShinyButton variant="primary" className="w-full justify-center py-4 text-lg" disabled={loading}>
            {loading ? "Creating..." : "Create Team"}
          </ShinyButton>
        </form>
      </div>
    </div>
  );
}

export default function CreateTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <RequireAuth requireVerified={true}>
      <CreateTeamContent id={id} />
    </RequireAuth>
  );
}
