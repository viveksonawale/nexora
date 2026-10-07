import { Sidebar } from "@/components/dashboard/Sidebar";
import { RequireAuth } from "@/components/shared/RequireAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex h-screen bg-[var(--bg-canvas)] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
