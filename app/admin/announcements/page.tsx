"use client";

import { useState } from "react";
import { Megaphone, Plus, Bell, CheckCircle2, Clock } from "lucide-react";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([
    {
      id: "1",
      title: "Nexora 2026 Grand Opening & Keynote Released",
      hackathon: "Nexora 2026",
      scope: "GLOBAL",
      date: "Oct 1, 2026",
      pinned: true,
      author: "Super Admin",
    },
    {
      id: "2",
      title: "Submission Guidelines & Blind Judging Criteria Clarified",
      hackathon: "IIT Delhi Hackathon",
      scope: "PARTICIPANTS",
      date: "Oct 5, 2026",
      pinned: true,
      author: "IIT Delhi Staff",
    },
    {
      id: "3",
      title: "Quantum Simulation Environment Docker Containers Available",
      hackathon: "IIT Bombay Hackathon",
      scope: "PARTICIPANTS",
      date: "Oct 10, 2026",
      pinned: false,
      author: "IIT Bombay Organizers",
    },
    {
      id: "4",
      title: "Platform Maintenance & Mumbai Supabase Migration Complete",
      hackathon: "Platform-wide",
      scope: "ALL_USERS",
      date: "Today",
      pinned: false,
      author: "Nexora Infrastructure",
    },
  ]);

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Announcements Broadcast
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Broadcast platform-wide updates, deadline warnings, and emergency notifications.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm">
          <Plus size={16} />
          <span>New Broadcast</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#F97316]/40 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                <Megaphone size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] font-display">
                    {ann.title}
                  </h3>
                  {ann.pinned && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">
                      PINNED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mt-1.5 font-sans">
                  <span>Scope: <strong className="text-[var(--text-primary)]">{ann.scope}</strong></span>
                  <span>Event: <strong className="text-[var(--text-primary)]">{ann.hackathon}</strong></span>
                  <span>By: <strong className="text-[var(--text-primary)]">{ann.author}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center font-mono text-xs text-[var(--text-secondary)]">
              <Clock size={13} />
              <span>{ann.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

