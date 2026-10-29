"use client";

import { useState } from "react";
import { ShinyButton } from "@/app/components/ShinyButton";
import { apiFetch } from "@/lib/api-client";
import { 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Shield
} from "lucide-react";

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isMinLength = newPassword.length >= 8;
  const isMatching = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (!isMinLength) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess("Password updated successfully. Keep your credentials secure.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl font-sans">
      <div className="pb-4 border-b border-[var(--border)]">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2.5">
          <KeyRound size={20} className="text-[#F97316]" />
          Account Security & Password
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Update your password regularly to prevent unauthorized access to your account and teams.
        </p>
      </div>

      {error && (
        <div className="p-4 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-5">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              required
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] text-xs sm:text-sm font-medium transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] text-xs sm:text-sm font-medium transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316] text-xs sm:text-sm font-medium transition-colors"
          />
        </div>

        {/* Password Strength Checklist */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)]/70 space-y-2">
          <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Password Requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-1.5 ${isMinLength ? "text-emerald-400" : "text-[var(--text-secondary)]"}`}>
              <CheckCircle2 size={13} className={isMinLength ? "text-emerald-500" : "opacity-40"} />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${isMatching ? "text-emerald-400" : "text-[var(--text-secondary)]"}`}>
              <CheckCircle2 size={13} className={isMatching ? "text-emerald-500" : "opacity-40"} />
              <span>Passwords match</span>
            </div>
          </div>
        </div>

        {/* Security Recommendation Box */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-canvas)] text-xs text-[var(--text-secondary)] flex items-start gap-3">
          <Shield size={16} className="text-[#F97316] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Changing your password keeps your current device logged in. If you suspect unauthorized access, make sure to visit the <strong className="text-[var(--text-primary)]">Active Sessions</strong> tab to revoke other devices.
          </p>
        </div>

        <div className="pt-4 border-t border-[var(--border)]">
          <ShinyButton
            type="submit"
            variant="primary"
            size="md"
            className="py-2.5 px-6"
            disabled={loading}
          >
            {loading ? "Updating Password..." : "Update Password"}
          </ShinyButton>
        </div>
      </form>
    </div>
  );
}
