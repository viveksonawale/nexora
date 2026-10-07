"use client";

import { RequireAuth } from "@/components/shared/RequireAuth";
import { ShinyButton } from "@/app/components/ShinyButton";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession, user } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    headline: (user as any)?.profile?.headline || "",
    bio: (user as any)?.profile?.bio || "",
    githubUrl: (user as any)?.profile?.githubUrl || "",
    linkedinUrl: (user as any)?.profile?.linkedinUrl || "",
    location: (user as any)?.profile?.location || "",
  });

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await apiFetch("/me", {
        method: "PATCH",
        body: JSON.stringify({ ...formData, onboardingCompleted: true }),
      });
      await refreshSession();
      const returnUrl = searchParams.get("returnUrl") || "/explore";
      router.push(returnUrl);
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form onSubmit={handleComplete} className="w-full max-w-lg bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl p-8 space-y-6">
        <div className="space-y-2 text-center mb-8">
          <h1 className="text-3xl font-display font-bold">Welcome to Nexora!</h1>
          <p className="text-[var(--text-secondary)]">Let's set up your hacker profile.</p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Headline (Optional)</label>
            <input
              type="text"
              value={formData.headline}
              onChange={e => setFormData(p => ({ ...p, headline: e.target.value }))}
              placeholder="e.g. Fullstack Developer @ TechCorp"
              className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Location (Optional)</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)]">GitHub URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={e => setFormData(p => ({ ...p, githubUrl: e.target.value }))}
                placeholder="https://github.com/..."
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)]">LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={e => setFormData(p => ({ ...p, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Bio (Optional)</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell us a bit about yourself..."
              className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </div>

        <div className="pt-4">
          <ShinyButton variant="primary" className="w-full justify-center py-3" disabled={loading}>
            {loading ? "Saving..." : "Complete Onboarding"}
          </ShinyButton>
        </div>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <RequireAuth requireVerified={true}>
        <OnboardingContent />
      </RequireAuth>
    </Suspense>
  );
}
