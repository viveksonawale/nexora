"use client";

import { useState } from "react";
import { ShinyButton } from "@/app/components/ShinyButton";
import { apiFetch } from "@/lib/api-client";

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="text-xl font-bold font-display">Change Password</h2>
        <p className="text-sm text-[var(--text-secondary)]">Update your password to keep your account secure.</p>
      </div>

      {error && <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
      {success && <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg">{success}</div>}

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">New Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all outline-none"
          />
        </div>

        <ShinyButton variant="primary" className="py-2.5 px-6" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </ShinyButton>
      </form>
    </div>
  );
}
