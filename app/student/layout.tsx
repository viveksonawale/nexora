"use client";

import { useEffect, useState } from "react";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { StudentHeader } from "@/components/student/StudentHeader";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { apiFetch } from "@/lib/api-client";
import { usePathname } from "next/navigation";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [completenessScore, setCompletenessScore] = useState(0);
  const pathname = usePathname();

  const fetchBadges = async () => {
    try {
      const data: any = await apiFetch("/me/dashboard");
      if (data) {
        setUnreadNotifications(data.unreadNotificationsCount || 0);
        setPendingInvitesCount(data.pendingInvites?.length || 0);
        setCompletenessScore(data.completeness?.score || 0);
      }
    } catch {
      // Best effort
    }
  };

  useEffect(() => {
    fetchBadges();
  }, [pathname]);

  return (
    <RequireAuth>
      <div className="flex h-screen bg-[#0d0e11] overflow-hidden font-sans text-zinc-100">
        <StudentSidebar
          pendingInvitesCount={pendingInvitesCount}
          unreadNotificationsCount={unreadNotifications}
          completenessScore={completenessScore}
        />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <StudentHeader
            unreadNotifications={unreadNotifications}
            completenessScore={completenessScore}
          />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0d0e11] scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}

