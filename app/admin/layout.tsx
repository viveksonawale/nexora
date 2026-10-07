"use client";

import { RequireAuth } from "@/components/shared/RequireAuth";
import { Sidebar } from "./Sidebar";
import { useSession } from "@/lib/contexts/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/shared/states";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && (user as any).platformRole !== "SUPER_ADMIN") {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <LoadingState message="Verifying..." />;

  if ((user as any)?.platformRole !== "SUPER_ADMIN") return null;

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
