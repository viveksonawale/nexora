"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import { ShinyButton } from "@/app/components/ShinyButton";
import { Calendar, ChevronRight } from "lucide-react";

export default function MyEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/me/judging/hackathons")
      .then((data: any) => setEvents(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading your events..." />;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">My Judging Events</h1>
        <p className="text-[var(--text-secondary)] font-sans mt-2">
          Hackathons where you are registered as a judge.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full p-12 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl text-center text-[var(--text-secondary)]">
            You are not assigned as a judge for any upcoming hackathons.
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">{event.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] font-sans mt-2 line-clamp-2">{event.tagline || event.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg inline-flex">
                  <Calendar size={14} /> {new Date(event.startsAt).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-end">
                <Link href={`/judge/assignments?hackathonId=${event.id}`}>
                  <ShinyButton variant="primary" className="flex items-center gap-2 text-sm">
                    View Assignments <ChevronRight size={16} />
                  </ShinyButton>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
