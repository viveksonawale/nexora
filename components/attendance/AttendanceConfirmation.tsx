"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, User, Calendar } from "lucide-react";
import { SpotlightCard } from "@/app/components/SpotlightCard";
import { getRandomNexoraNote } from "@/lib/attendance/attendance-messages";

export function AttendanceConfirmation() {
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    // Get previous index from session storage to avoid immediate repeats on page reloads
    const prevIndexStr = sessionStorage.getItem("nexora_last_note_index");
    const prevIndex = prevIndexStr ? parseInt(prevIndexStr, 10) : -1;
    
    const { note: newNote, index: newIndex } = getRandomNexoraNote(prevIndex);
    
    sessionStorage.setItem("nexora_last_note_index", newIndex.toString());
    setNote(newNote);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="w-full rounded-3xl bg-[var(--bg-elevated)]/70 backdrop-blur-xl border-[var(--border)] overflow-hidden shadow-2xl shadow-orange-500/10 transition-all">
        
        {/* Top Header - Confirmation */}
        <div className="bg-[#F97316]/10 border-b border-[var(--border)] p-8 md:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F97316]/5 to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-[#F97316]/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-[#F97316]/5 relative z-10 animate-in zoom-in duration-500">
            <CheckCircle2 size={40} className="text-[#F97316]" strokeWidth={2.5} />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2 relative z-10">
            Attendance<br />Confirmed
          </h2>
          <p className="font-sans text-sm md:text-base text-[var(--text-secondary)] font-medium relative z-10">
            You're checked in for the session
          </p>
        </div>

        {/* Middle - Session Details */}
        <div className="p-6 md:p-8 border-b border-[var(--border)] space-y-4 bg-[var(--bg-canvas)]/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center shadow-sm">
              <User size={18} className="text-[var(--text-primary)]" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">Participant</div>
              <div className="font-sans text-sm md:text-base font-bold text-[var(--text-primary)]">Demo Developer</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center shadow-sm">
              <Calendar size={18} className="text-[var(--text-primary)]" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">Session</div>
              <div className="font-sans text-sm md:text-base font-bold text-[var(--text-primary)]">Hackathon 2026 - Day 1</div>
            </div>
          </div>
        </div>

        {/* Bottom - Nexora Note */}
        <div className="p-6 md:p-8 bg-gradient-to-b from-transparent to-[var(--bg-canvas)]/50 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="flex items-center gap-2 mb-5 relative z-10">
            <Sparkles size={14} className="text-[#F97316]" />
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#F97316]">
              Nexora Note
            </span>
          </div>
          
          <div className="relative z-10 pl-4">
            <div className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-[#F97316] to-[#EA580C] rounded-full opacity-70" />
            <p className="font-sans text-base md:text-lg text-[var(--text-primary)] leading-relaxed italic opacity-90 transition-opacity duration-700 ease-in-out font-medium">
              {note ? `"${note}"` : <span className="opacity-0">Loading...</span>}
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[var(--border)] border-dashed text-center relative z-10">
            <div className="font-mono text-[10px] font-medium text-[var(--text-secondary)] opacity-60 flex items-center justify-center gap-2">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span className="uppercase">NX-ATT-CONF</span>
            </div>
          </div>
        </div>

      </SpotlightCard>
    </div>
  );
}
