"use client";

import { use } from "react";
import { hackathons } from "../../../data/hackathons";
import { notFound } from "next/navigation";

export default function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hackathon = hackathons.find((h) => h.slug === id);

  if (!hackathon) {
    notFound();
  }

  const schedule = [
    { date: "17 AUG 2026 (MON)", time: "12:00 AM", event: "Registrations begin" },
    { date: "07 SEP 2026 (MON)", time: "12:00 AM", event: "Hackathon starts" },
    { date: "28 SEP 2026 (MON)", time: "11:59 PM", event: "Registrations end" },
    { date: "05 OCT 2026 (MON)", time: "11:59 PM", event: "Hackathon ends" },
    { date: "12 OCT 2026 (MON)", time: "02:00 PM", event: "Results announced" },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
        Schedule
      </h2>
      <div className="p-8 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)]">
        <div className="space-y-8">
          {schedule.map((item, i) => (
            <div key={i} className="flex flex-col md:flex-row md:gap-12 pb-8 border-b border-[var(--border)] last:border-0 last:pb-0">
              <div className="w-48 shrink-0">
                <div className="font-sans text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-2 bg-[var(--bg-canvas)] px-3 py-1.5 rounded-lg inline-block border border-[var(--border)]">
                  {item.date}
                </div>
                <div className="font-sans font-semibold text-lg">{item.time}</div>
              </div>
              <div className="flex-1 mt-4 md:mt-0">
                <div className="text-lg font-sans text-[var(--text-primary)]">{item.event}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
