"use client";

import { useSession } from "@/lib/contexts/SessionContext";

export default function ProfileSettingsPage() {
  const { user } = useSession();

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="text-xl font-bold font-display">Profile Details</h2>
        <p className="text-sm text-[var(--text-secondary)]">Your basic profile information.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            readOnly
            value={user?.name || ""}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] opacity-70 cursor-not-allowed text-[var(--text-primary)]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            readOnly
            value={user?.email || ""}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] opacity-70 cursor-not-allowed text-[var(--text-primary)]"
          />
        </div>
        
        <p className="text-xs text-[var(--text-secondary)]">Contact support to change your name or email.</p>
      </div>
    </div>
  );
}
