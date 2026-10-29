"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { SpotlightCard } from "@/app/components/SpotlightCard";
import Link from "next/link";
import { ArrowRight, QrCode, Scan, Trophy } from "lucide-react";
import { LoadingState } from "@/components/shared/states";

export default function AttendanceGatewayPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/hackathons")
      .then((data: any) => {
        if (Array.isArray(data)) setHackathons(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading events..." />;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8 pt-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#F97316] font-mono text-xs font-semibold uppercase tracking-wider">
            <QrCode size={13} />
            Attendance Gateway
          </div>
          <h1 className="font-display text-4xl font-extrabold">Select Hackathon Event</h1>
          <p className="font-sans text-[var(--text-secondary)] text-sm max-w-md mx-auto">
            Choose an event below to launch the Organizer Live Display or open your Student Camera Scanner.
          </p>
        </div>

        {hackathons.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-secondary)]">
            No events found. <Link href="/hackathons" className="text-[#F97316] underline">Browse Hackathons</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hackathons.map((h) => (
              <SpotlightCard key={h.id} spotlightColor="rgba(249, 115, 22, 0.15)" className="p-6 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center font-bold font-display">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">{h.title}</h3>
                    <div className="font-sans text-xs text-[var(--text-secondary)]">{h.mode} • {new Date(h.startsAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    href={`/dashboard/hackathons/${h.id}/check-in`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] border border-orange-500/20 text-xs font-semibold font-mono"
                  >
                    Organizer Screen
                  </Link>
                  <Link
                    href={`/hackathons/${h.id}/check-in`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold font-mono shadow-md shadow-orange-500/20"
                  >
                    <Scan size={14} />
                    Scan Attendance
                  </Link>
                </div>
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
