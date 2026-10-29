"use client";

import { RequireAuth } from "@/components/shared/RequireAuth";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth requireVerified={true}>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] selection:bg-[#F97316]/30 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <DashboardHeader roleLabel="Judge" />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-[var(--bg-canvas)]">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
