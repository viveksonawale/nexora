"use client";

import { RequireAuth } from "@/components/shared/RequireAuth";
import { Sidebar } from "./Sidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useSession } from "@/lib/contexts/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/shared/states";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  const isPermitted =
    (user as any)?.platformRole === "SUPER_ADMIN" ||
    (user as any)?.platformRole === "SUPPORT_ADMIN";

  useEffect(() => {
    if (!isLoading && user && !isPermitted) {
      router.push("/");
    }
  }, [user, isLoading, isPermitted, router]);

  if (isLoading) return <LoadingState message="Verifying..." />;

  if (!isPermitted) return null;

  return (
    <RequireAuth requireVerified={true}>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] selection:bg-[#F97316]/30 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-[var(--bg-canvas)]">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
