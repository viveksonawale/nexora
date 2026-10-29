"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Search, Sun, Moon, ChevronDown, Settings, LogOut, Shield } from "lucide-react";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { useSession } from "@/lib/contexts/SessionContext";
import { apiFetch } from "@/lib/api-client";

export function AdminHeader() {
  const { user } = useSession();
  const [theme, setTheme] = useState("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("nexora-theme", nextTheme);
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const displayName = user?.name || "Nexora Admin";
  const displayEmail = user?.email || "admin@nexora.app";
  const displayRole = user?.platformRole === "SUPER_ADMIN" ? "Super Admin" : "Administrator";
  const avatarChar = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 px-6 sm:px-8 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Search Input with Ctrl K */}
      <div className="relative w-64 sm:w-96">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search teams, users, organizations..."
          className="w-full pl-10 pr-16 py-2 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#F97316]/60 transition-colors font-sans"
        />
        <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
          Ctrl K
        </kbd>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Theme Toggle (Sun/Moon) */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#F97316]/40 flex items-center justify-center transition-colors shadow-sm"
        >
          {theme === "dark" ? (
            <Sun size={17} className="text-[#F97316]" />
          ) : (
            <Moon size={17} className="text-[#F97316]" />
          )}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Profile Pill & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-[var(--bg-canvas)] transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#18181b] border border-[var(--border)] text-white font-bold font-display flex items-center justify-center text-xs shadow-sm group-hover:border-[#F97316]/50 transition-colors">
              {avatarChar}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] leading-tight font-sans">
                {displayRole}
              </div>
            </div>
            <ChevronDown
              size={13}
              className={`text-[var(--text-secondary)] hidden sm:block transition-transform duration-200 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* User Menu Popover */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
              <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] font-mono truncate">
                  {displayEmail}
                </div>
              </div>

              <Link
                href="/settings/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors"
              >
                <Settings size={14} className="text-[var(--text-secondary)]" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
