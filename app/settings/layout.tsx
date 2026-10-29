"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { useSession } from "@/lib/contexts/SessionContext";
import { 
  User, 
  ShieldCheck, 
  Laptop, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  ShieldAlert,
  ChevronRight 
} from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();

  const tabs = [
    { 
      label: "Profile & Portfolio", 
      href: "/settings/profile", 
      icon: User,
      description: "Bio, skills, projects & social links"
    },
    { 
      label: "Security", 
      href: "/settings/security", 
      icon: ShieldCheck,
      description: "Password & access controls"
    },
    { 
      label: "Active Sessions", 
      href: "/settings/sessions", 
      icon: Laptop,
      description: "Devices & security audit logs"
    },
  ];

  // Derive user initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "NX";

  return (
    <RequireAuth requireVerified={true}>
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative overflow-x-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-16 left-1/4 w-[500px] h-[500px] bg-[#F97316]/[0.035] rounded-full blur-[140px]" />
          <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-[#FB923C]/[0.03] rounded-full blur-[130px]" />
        </div>

        {/* Content Container - pt-28 md:pt-36 ensures zero overlap with the fixed top Navbar */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-36 pb-24 space-y-8">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[var(--border)]/60">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-md text-[11px] font-mono text-[#F97316] mb-3 shadow-xs">
                <Sliders size={12} className="text-[#F97316]" />
                <span className="text-[var(--text-secondary)] font-medium uppercase tracking-wider">
                  Account Preferences
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-[var(--text-primary)]">
                Account Settings
              </h1>
              <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1.5 max-w-2xl">
                Manage your public developer profile, hackathon showcase, account security credentials, and active sessions.
              </p>
            </div>

            {/* Quick status pill */}
            {user && (
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-xs text-[var(--text-secondary)] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Account Verified</span>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 shrink-0 space-y-4">
              {/* Mini User Summary Card */}
              {user && (
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-md shadow-xs flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white font-bold flex items-center justify-center text-base shadow-sm shadow-orange-500/20 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate font-display">
                        {user.name}
                      </p>
                      {user.platformRole === "SUPER_ADMIN" ? (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Admin
                        </span>
                      ) : (
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = pathname === tab.href;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className={`group relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 whitespace-nowrap lg:whitespace-normal border ${
                        isActive
                          ? "bg-[var(--bg-elevated)] border-[#F97316]/50 shadow-md shadow-orange-500/5 text-[var(--text-primary)] ring-1 ring-[#F97316]/20"
                          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/60"
                      }`}
                    >
                      {/* Active indicator bar on desktop */}
                      {isActive && (
                        <div className="hidden lg:block absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#F97316]" />
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isActive
                              ? "bg-[#F97316]/10 text-[#F97316]"
                              : "bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Icon size={17} />
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-semibold leading-tight ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`}>
                            {tab.label}
                          </p>
                          <p className="hidden lg:block text-[11px] text-[var(--text-secondary)] mt-0.5 opacity-80 truncate">
                            {tab.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={15}
                        className={`hidden lg:block transition-transform ${
                          isActive
                            ? "text-[#F97316] translate-x-0.5"
                            : "text-[var(--text-secondary)]/40 group-hover:text-[var(--text-secondary)] group-hover:translate-x-0.5"
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>

              {/* Developer Tip Box */}
              <div className="hidden lg:block p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/40 text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#F97316] font-semibold">
                  <Sparkles size={14} />
                  <span>Pro Tip</span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed text-[11px]">
                  Keep your skills and project portfolio updated. Team captains frequently search for active developers during hackathon matchmaking.
                </p>
              </div>
            </aside>

            {/* Main Content Card with glassmorphism */}
            <main className="flex-1 min-w-0 w-full">
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-black/20 backdrop-blur-xl relative overflow-hidden">
                {/* Subtle top edge specular highlight */}
                <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/30 to-transparent" />
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
