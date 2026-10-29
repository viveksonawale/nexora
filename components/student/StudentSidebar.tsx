"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/contexts/SessionContext";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Mail,
  Bell,
  User,
  FileText,
  Award,
  Settings,
  LogOut,
  Building2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export function StudentSidebar({
  pendingInvitesCount = 0,
  unreadNotificationsCount = 0,
  completenessScore = 0,
}: {
  pendingInvitesCount?: number;
  unreadNotificationsCount?: number;
  completenessScore?: number;
}) {
  const pathname = usePathname();
  const { user } = useSession();

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best effort
    }
    window.location.href = "/";
  };

  const navItems = [
    { label: "Overview", route: "/student", icon: LayoutDashboard },
    { label: "My Hackathons", route: "/student/hackathons", icon: Trophy },
    { label: "My Teams", route: "/student/teams", icon: Users },
    {
      label: "Invitations",
      route: "/student/invitations",
      icon: Mail,
      badge: pendingInvitesCount > 0 ? pendingInvitesCount : null,
    },
    {
      label: "Notifications",
      route: "/student/notifications",
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
    },
    { label: "My Profile", route: "/student/profile", icon: User },
    {
      label: "Resume",
      route: "/student/resume",
      icon: FileText,
      badgeText: completenessScore === 100 ? "100%" : `${completenessScore}%`,
      badgeColor: completenessScore === 100 ? "emerald" : "orange",
    },
    { label: "Certificates", route: "/student/certificates", icon: Award },
    { label: "Settings", route: "/student/settings", icon: Settings },
  ];

  const displayName = user?.name || "Student";
  const displayEmail = user?.email || "student@nexora.app";
  const avatarChar = displayName.charAt(0).toUpperCase();
  const hasOrg = user?.orgMemberships && user.orgMemberships.length > 0;

  return (
    <aside className="w-64 flex-none bg-[#111215] text-zinc-300 border-r border-[#1e2026] h-full flex flex-col select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1e2026] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/logo/logo.png"
              alt="Nexora Logo"
              width={32}
              height={32}
              className="object-contain w-8 h-8"
              priority
            />
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">Nexora</span>
          <span className="text-[11px] font-mono font-semibold text-[#F97316] bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
            Student
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive =
            item.route === "/student"
              ? pathname === "/student"
              : pathname === item.route || pathname.startsWith(`${item.route}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.route}
              href={item.route}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-[#F97316] border border-orange-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon size={17} className={isActive ? "text-[#F97316]" : "text-zinc-400"} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge ? (
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-[#F97316] text-white">
                  {item.badge}
                </span>
              ) : item.badgeText ? (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                    item.badgeColor === "emerald"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  }`}
                >
                  {item.badgeText}
                </span>
              ) : null}
            </Link>
          );
        })}

        {/* Organizer Switch link if user has verified college/org membership */}
        {hasOrg && user?.onboardingStatus === "VERIFIED" && (
          <div className="pt-4 mt-4 border-t border-[#1e2026]">
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-zinc-400" />
                <span>Organizer Console</span>
              </div>
              <ChevronRight size={13} />
            </Link>
          </div>
        )}
      </nav>

      {/* User Card & Sign Out */}
      <div className="p-4 border-t border-[#1e2026] space-y-3 bg-[#0d0e11]">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-[#1e2026] border border-zinc-700 text-white font-bold font-display flex items-center justify-center text-sm shrink-0 overflow-hidden">
            {(user as any)?.profile?.avatarUrl ? (
              <img
                src={(user as any).profile.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              avatarChar
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-medium text-xs text-white truncate">{displayName}</div>
            <div className="text-[11px] text-zinc-400 truncate font-mono">{displayEmail}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

