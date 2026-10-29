"use client";

import { use } from "react";
import { AttendanceConfirmation } from "@/components/attendance/AttendanceConfirmation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col selection:bg-[#F97316]/30">
      <main className="flex-1 flex flex-col items-center justify-center relative pt-16 pb-12 overflow-hidden px-6">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="w-[600px] h-[600px] bg-[#F97316]/5 rounded-full blur-[120px] opacity-70" />
        </div>
        
        <div className="w-full max-w-md mx-auto mb-8 relative z-10 flex justify-start">
          <Link 
            href={`/dashboard/hackathons/${id}/check-in`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group px-3 py-1.5 rounded-full hover:bg-[var(--bg-elevated)]"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Organizer Dashboard
          </Link>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <AttendanceConfirmation />
        </div>
      </main>
    </div>
  );
}
