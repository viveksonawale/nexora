"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import { CheckCircle2, AlertCircle } from "lucide-react";

function RegisterContent({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hackathon, setHackathon] = useState<any>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    apiFetch(`/hackathons/${id}`)
      .then((data: any) => setHackathon(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiFetch(`/hackathons/${id}/registrations`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      // Redirect to the "My Registration" tab (which doesn't exist yet, we will create Teams/My Registration)
      router.push(`/hackathons/${id}/teams`);
    } catch (err: any) {
      if (err.message.includes("ONBOARDING_INCOMPLETE")) {
        router.push(`/onboarding?returnUrl=/hackathons/${id}/register`);
      } else {
        setError(err.message || "Registration failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading registration form..." />;
  if (error && !hackathon) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8 space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold text-[var(--text-primary)]">
          Register for {hackathon.title}
        </h2>
        <p className="text-[var(--text-secondary)] font-sans">
          Complete the form below to secure your spot.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-sans text-sm">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Placeholder for custom registration questions */}
        <div className="p-6 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl flex items-center gap-4">
          <CheckCircle2 className="text-green-500 shrink-0" size={24} />
          <div>
            <h3 className="font-sans font-bold text-[var(--text-primary)]">Your profile looks good!</h3>
            <p className="text-sm text-[var(--text-secondary)] font-sans">We will use your default Nexora profile for this application.</p>
          </div>
        </div>

        <ShinyButton variant="primary" className="w-full justify-center py-4 text-lg" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Registration"}
        </ShinyButton>
      </form>
    </div>
  );
}

export default function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <RequireAuth requireVerified={true}>
      <RegisterContent id={id} />
    </RequireAuth>
  );
}
