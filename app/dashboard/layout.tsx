import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RequireAuth } from "@/components/shared/RequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth requireVerified={true}>
      <div className="flex h-screen bg-[var(--bg-canvas)] overflow-hidden font-sans text-[var(--text-primary)]">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <DashboardHeader roleLabel="Organizer" />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-[var(--bg-canvas)]">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
