"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/contexts/SessionContext";
import {
  LayoutDashboard,
  Trophy,
  Building2,
  Users,
  Users2,
  FileText,
  ShieldCheck,
  Megaphone,
  Award,
  BarChart3,
  Settings,
  ClipboardList,
  LogOut,
  KeyRound,
  LifeBuoy,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  const handleLogout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const menuItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
    { label: "Hackathons", href: "/admin/hackathons", icon: Trophy },
    { label: "Organizations", href: "/admin/organizations", icon: Building2 },
    { label: "Users & RBAC", href: "/admin/users", icon: Users },
    { label: "Role Matrix", href: "/admin/roles", icon: KeyRound },
    { label: "Support Queue", href: "/admin/support", icon: LifeBuoy },
    { label: "Teams", href: "/admin/teams", icon: Users2 },
    { label: "Submissions", href: "/admin/submissions", icon: FileText },
    { label: "Judging", href: "/admin/judging", icon: ShieldCheck },
    { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { label: "Certificates", href: "/admin/certificates", icon: Award },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Settings", href: "/settings/profile", icon: Settings },
    { label: "Audit Log", href: "/admin/audit", icon: ClipboardList },
  ];

  const displayName = user?.name || "Nexora Super Admin";
  const displayEmail = user?.email || "admin@nexora.app";
  const avatarChar = displayName.charAt(0).toUpperCase();

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
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {menuItems.map((item, idx) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-[#F97316] border border-orange-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={17} className={isActive ? "text-[#F97316]" : "text-zinc-400"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card & Sign Out */}
      <div className="p-4 border-t border-[#1e2026] space-y-3 bg-[#0d0e11]">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-[#1e2026] border border-zinc-700 text-white font-bold font-display flex items-center justify-center text-sm shrink-0">
            {avatarChar}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-medium text-xs text-white truncate">{displayName}</div>
            <div className="text-[11px] text-zinc-400 truncate font-mono">{displayEmail}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 border border-zinc-700/60 bg-white/[0.02] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
