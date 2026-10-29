"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_CONFIG } from "@/lib/nav-config";
import { useSession } from "@/lib/contexts/SessionContext";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Settings,
  UserCheck,
  Users2,
  FileText,
  ShieldCheck,
  QrCode,
  Megaphone,
  Award,
  ClipboardList,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  // If we are deep inside a hackathon view, use the hackathon sub-nav
  const isHackathonView = pathname.match(/^\/dashboard\/hackathons\/[^\/]+/);
  const navItems = isHackathonView ? NAV_CONFIG.organizerHackathon : NAV_CONFIG.organizer;

  const handleLogout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("back")) return ArrowLeft;
    if (l.includes("overview") || l.includes("dashboard")) return LayoutDashboard;
    if (l.includes("hackathon")) return Trophy;
    if (l.includes("members")) return Users;
    if (l.includes("setting") || l.includes("setup")) return Settings;
    if (l.includes("registration")) return UserCheck;
    if (l.includes("team")) return Users2;
    if (l.includes("submission")) return FileText;
    if (l.includes("judg")) return ShieldCheck;
    if (l.includes("check-in") || l.includes("qr")) return QrCode;
    if (l.includes("announcement")) return Megaphone;
    if (l.includes("result")) return Award;
    if (l.includes("audit")) return ClipboardList;
    return LayoutDashboard;
  };

  const displayName = user?.name || "Organizer";
  const displayEmail = user?.email || "organizer@nexora.app";
  const avatarChar = displayName.charAt(0).toUpperCase();

  return (
    <aside className="w-64 flex-none bg-[#111215] text-zinc-300 border-r border-[#1e2026] h-full flex flex-col select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1e2026] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
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
            Org
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {navItems.map((item, idx) => {
          let route = item.route;
          if (isHackathonView && route !== "/dashboard" && route !== "/dashboard/hackathons") {
            const match = pathname.match(/^\/dashboard\/hackathons\/[^\/]+/);
            if (match) {
              route = `${match[0]}/${route}`;
            }
          }

          const isActive =
            pathname === route ||
            (item.route !== "/dashboard" && item.route !== "/dashboard/hackathons" && pathname.startsWith(route));

          const Icon = getIcon(item.label);

          return (
            <Link
              key={idx}
              href={route}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-[#F97316] border border-orange-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={17} className={isActive ? "text-[#F97316]" : "text-zinc-400"} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card & Sign Out */}
      <div className="p-4 border-t border-[#1e2026] space-y-3 bg-[#0d0e11]">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-[#1e2026] border border-zinc-700 text-white font-bold font-display flex items-center justify-center text-sm shrink-0">
            {(user as any)?.profile?.avatarUrl ? (
              <img
                src={(user as any).profile.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
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
