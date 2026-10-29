"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/contexts/SessionContext";
import { Bell, Compass, User, ExternalLink, Sparkles, ScanLine, QrCode } from "lucide-react";
import { ShinyButton } from "@/app/components/ShinyButton";

export function StudentHeader({
  unreadNotifications = 0,
  completenessScore = 0,
}: {
  unreadNotifications?: number;
  completenessScore?: number;
}) {
  const pathname = usePathname();
  const { user } = useSession();

  const getPageTitle = () => {
    if (pathname === "/student") return "Student Dashboard";
    if (pathname.startsWith("/student/hackathons")) return "My Hackathons";
    if (pathname.startsWith("/student/teams")) return "My Teams";
    if (pathname.startsWith("/student/invitations")) return "Team Invitations";
    if (pathname.startsWith("/student/notifications")) return "Notifications";
    if (pathname.startsWith("/student/profile")) return "Student Profile";
    if (pathname.startsWith("/student/resume")) return "Resume Builder";
    if (pathname.startsWith("/student/certificates")) return "Certificates & Achievements";
    if (pathname.startsWith("/student/settings")) return "Account Settings";
    return "Student Workspace";
  };

  const userSlug = (user as any)?.profile?.slug;

  return (
    <header className="h-16 flex-none border-b border-[#1e2026] bg-[#0d0e11] px-6 flex items-center justify-between text-zinc-300">
      <div className="flex items-center gap-3">
        <h1 className="font-display font-bold text-lg text-white tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Public profile button if student has a slug */}
        {userSlug && (
          <Link
            href={`/profiles/${userSlug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-zinc-800 transition-colors"
          >
            <span>Public Profile</span>
            <ExternalLink size={12} />
          </Link>
        )}

        {/* Quick QR Check-In Shortcut */}
        <Link
          href="/student/hackathons"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-all shadow-sm shadow-orange-500/10 group"
          title="Attendance QR Check-In"
        >
          <ScanLine size={14} className="text-[#F97316] group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Scan QR</span>
        </Link>

        {/* Explore Hackathons */}
        <Link href="/hackathons">
          <ShinyButton variant="secondary" size="sm" className="gap-1.5 py-1.5 px-3">
            <Compass size={14} className="text-[#F97316]" />
            <span className="hidden sm:inline">Explore Hackathons</span>
          </ShinyButton>
        </Link>

        {/* Notification Bell */}
        <Link
          href="/student/notifications"
          className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#F97316] rounded-full ring-2 ring-[#0d0e11]" />
          )}
        </Link>

        {/* User Avatar */}
        <Link
          href="/student/profile"
          className="w-8 h-8 rounded-full bg-[#1e2026] border border-zinc-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden hover:ring-2 hover:ring-[#F97316]/50 transition-all"
        >
          {(user as any)?.profile?.avatarUrl ? (
            <img
              src={(user as any).profile.avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            (user?.name || "U").charAt(0).toUpperCase()
          )}
        </Link>
      </div>
    </header>
  );
}

