"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/shared/RequireAuth";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Profile", href: "/settings/profile" },
    { label: "Security", href: "/settings/security" },
    { label: "Sessions", href: "/settings/sessions" },
  ];

  return (
    <RequireAuth requireVerified={true}>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-[var(--text-secondary)]">Manage your account preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive 
                        ? "bg-[var(--bg-inverse)] text-[var(--bg-canvas)]" 
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          
          <main className="flex-1 min-w-0">
            <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
