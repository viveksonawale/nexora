"use client";

import { RequireAuth } from "@/components/shared/RequireAuth";
import { Sidebar } from "./Sidebar"; // wait, I'll create one

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth requireVerified={true}>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] selection:bg-[#F97316]/30 font-sans">
        <Sidebar />
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
