"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Settings,
  Lock,
  User,
  Shield,
  Smartphone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  LogOut,
  Bell,
} from "lucide-react";

export default function StudentSettingsPage() {
  const { user, refreshSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"GENERAL" | "SECURITY" | "SESSIONS" | "DANGER">("GENERAL");

  // Account General Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Active Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Danger Zone: Account Deactivation
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchSettings = async () => {
    try {
      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
      }

      // Fetch active sessions
      try {
        const sessData: any = await apiFetch("/auth/sessions");
        setSessions(Array.isArray(sessData?.sessions) ? sessData.sessions : Array.isArray(sessData) ? sessData : []);
      } catch {
        // Best effort
      }
    } catch (err: any) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    setMessage(null);
    try {
      await apiFetch("/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      setMessage({ text: "Account details saved successfully!", type: "success" });
      await refreshSession();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to update account", type: "error" });
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ text: "New password must be at least 8 characters.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    setSavingPassword(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage({ text: "Password changed successfully!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to change password", type: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    setMessage(null);
    try {
      await apiFetch(`/auth/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setMessage({ text: "Session revoked successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to revoke session", type: "error" });
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleLogoutAllOther = async () => {
    if (!confirm("Sign out of all other devices and active sessions?")) return;
    try {
      await apiFetch("/auth/logout-all", { method: "POST" });
      setMessage({ text: "All other sessions have been terminated.", type: "success" });
      await fetchSettings();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to terminate sessions", type: "error" });
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      setMessage({ text: 'Please type "DELETE MY ACCOUNT" exactly to confirm.', type: "error" });
      return;
    }

    if (!confirm("This action is permanent and cannot be undone. Anonymize and delete your account now?")) {
      return;
    }

    setDeletingAccount(true);
    try {
      await apiFetch("/me", { method: "DELETE" });
      window.location.href = "/";
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to delete account", type: "error" });
      setDeletingAccount(false);
    }
  };

  if (loading) return <LoadingState message="Loading settings..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage credentials, security preferences, active sessions, and account governance.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[#1e2026] gap-2 pb-2 overflow-x-auto no-scrollbar">
        {[
          { key: "GENERAL", label: "General & Identity", icon: User },
          { key: "SECURITY", label: "Security & Credentials", icon: Lock },
          { key: "SESSIONS", label: "Active Sessions", icon: Smartphone },
          { key: "DANGER", label: "Danger Zone", icon: AlertCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#F97316] text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General & Identity */}
      {activeTab === "GENERAL" && (
        <form onSubmit={handleSaveGeneral} className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-6">
          <div className="flex items-center gap-2 border-b border-[#1e2026] pb-4">
            <User size={18} className="text-[#F97316]" />
            <h3 className="font-display font-bold text-base text-white">Basic Account Information</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Account Email</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-800 text-zinc-500 text-xs font-mono cursor-not-allowed"
              />
              <span className="text-[11px] text-zinc-500 block">
                Email address is linked to your platform authentication.
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <ShinyButton
              variant="primary"
              size="sm"
              disabled={savingGeneral}
              className="py-2.5 px-6 text-xs font-semibold"
            >
              {savingGeneral ? "Saving..." : "Save Account Info"}
            </ShinyButton>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Credentials */}
      {activeTab === "SECURITY" && (
        <form onSubmit={handleChangePassword} className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-6">
          <div className="flex items-center gap-2 border-b border-[#1e2026] pb-4">
            <Lock size={18} className="text-[#F97316]" />
            <h3 className="font-display font-bold text-base text-white">Change Password</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
              <span className="text-[11px] text-zinc-500 block">Minimum 8 characters.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <ShinyButton
              variant="primary"
              size="sm"
              disabled={savingPassword}
              className="py-2.5 px-6 text-xs font-semibold"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </ShinyButton>
          </div>
        </form>
      )}

      {/* Tab 3: Active Sessions */}
      {activeTab === "SESSIONS" && (
        <div className="p-7 rounded-3xl bg-[#14161b] border border-[#232630] space-y-6">
          <div className="flex items-center justify-between border-b border-[#1e2026] pb-4">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-blue-400" />
              <h3 className="font-display font-bold text-base text-white">Active Login Sessions</h3>
            </div>
            {sessions.length > 1 && (
              <button
                onClick={handleLogoutAllOther}
                className="text-xs font-semibold text-red-400 hover:text-red-300"
              >
                Sign out of all other sessions
              </button>
            )}
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            These are the devices and browsers currently logged into your account. If you spot unfamiliar activity, revoke the session immediately and change your password.
          </p>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] text-xs text-zinc-400">
                Current active session only.
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-white block">
                      {s.userAgent || "Web Browser"}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 block">
                      IP: {s.ipAddress || "Unknown"} • Created: {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    disabled={revokingSessionId === s.id}
                    onClick={() => handleRevokeSession(s.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {revokingSessionId === s.id ? "Revoking..." : "Revoke"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Danger Zone */}
      {activeTab === "DANGER" && (
        <form onSubmit={handleDeleteAccount} className="p-7 rounded-3xl bg-[#14161b] border border-red-500/30 space-y-6">
          <div className="flex items-center gap-2 border-b border-red-500/20 pb-4">
            <AlertCircle size={18} className="text-red-400" />
            <h3 className="font-display font-bold text-base text-red-400">Account Deletion & Anonymization</h3>
          </div>

          <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
            <p>
              Deleting your account permanently anonymizes your personal information, revokes all active sessions, and disables access to all hackathon teams and certificates.
            </p>
            <p className="text-red-400 font-semibold">
              Warning: This action is permanent and cannot be reversed.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">
              Type <strong className="text-red-400 font-mono">DELETE MY ACCOUNT</strong> to confirm:
            </label>
            <input
              type="text"
              required
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0d0e11] border border-red-500/40 text-white text-xs font-mono focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={deletingAccount || deleteConfirmation !== "DELETE MY ACCOUNT"}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-40"
            >
              {deletingAccount ? "Anonymizing..." : "Permanently Delete Account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

