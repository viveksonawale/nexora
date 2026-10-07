"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import { ShinyButton } from "@/app/components/ShinyButton";
import { CheckCircle2, CircleDashed } from "lucide-react";

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hackathonId = searchParams.get("hackathonId");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hackathonId) {
      router.push("/judge/events");
      return;
    }

    apiFetch(`/hackathons/${hackathonId}/judging/my-assignments`)
      .then((data: any) => setAssignments(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [hackathonId, router]);

  if (loading) return <LoadingState message="Loading your assignments..." />;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Assigned Projects</h1>
        <p className="text-[var(--text-secondary)] font-sans mt-2">
          Review and score the submissions assigned to you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignments.length === 0 ? (
          <div className="col-span-full p-12 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl text-center text-[var(--text-secondary)]">
            You don't have any projects assigned for this hackathon yet.
          </div>
        ) : (
          assignments.map(a => {
            const isCompleted = !!a.finalizedAt;
            return (
              <div key={a.id} className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-bold text-lg text-[var(--text-primary)] truncate pr-4">
                      {a.submission.title}
                    </h3>
                    {isCompleted ? (
                      <CheckCircle2 size={24} className="text-green-500 shrink-0" />
                    ) : (
                      <CircleDashed size={24} className="text-orange-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] font-sans line-clamp-2">
                    {a.submission.tagline}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)]">
                  <Link href={`/judge/${hackathonId}/assignment/${a.id}`}>
                    <ShinyButton variant={isCompleted ? "secondary" : "primary"} className="w-full justify-center">
                      {isCompleted ? "View Scores" : "Evaluate Project"}
                    </ShinyButton>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <AssignmentsContent />
    </Suspense>
  );
}
