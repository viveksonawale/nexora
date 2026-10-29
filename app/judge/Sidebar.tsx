"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_CONFIG } from "@/lib/nav-config";
import { useSession } from "@/lib/contexts/SessionContext";
import { LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  const handleLogout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <aside className="w-64 flex-none border-r border-[var(--border)] bg-[var(--bg-elevated)] h-full flex flex-col">
      <div className="p-6 border-b border-[var(--border)]">
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
          <span className="font-display font-bold text-xl text-[var(--text-primary)] tracking-tight">
            Nexora
          </span>
          <span className="text-[11px] font-mono font-semibold text-[#F97316] bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
            Judge
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {NAV_CONFIG.judge.map((item, idx) => {
          const isActive = pathname === item.route || pathname.startsWith(item.route + "/");
          return (
            <Link
              key={idx}
              href={item.route}
              className={`block px-4 py-2.5 rounded-xl text-sm font-sans font-medium transition-colors ${
                isActive
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-canvas)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)] space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-canvas)] border border-[var(--border)] flex items-center justify-center font-bold font-display text-[var(--text-secondary)] overflow-hidden">
            {(user as any)?.profile?.avatarUrl ? (
              <img src={(user as any).profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || "U"
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-sans font-medium text-sm text-[var(--text-primary)] truncate">{user?.name}</div>
            <div className="font-sans text-xs text-[var(--text-secondary)] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-sans font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-canvas)] hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
