"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Mail,
  Award,
  Calendar,
  Megaphone,
  Trophy,
  ExternalLink,
  ChevronRight,
  Filter,
  QrCode,
  ScanLine,
  Scan,
} from "lucide-react";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data: any = await apiFetch("/notifications");
      if (data) {
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err: any) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await apiFetch("/notifications", { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error("Failed to mark notifications read", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      console.error("Failed to mark notification read", err);
    }
  };

  if (loading) return <LoadingState message="Loading notifications..." />;

  const filtered = notifications.filter((n) => {
    if (filterCategory === "ALL") return true;
    if (filterCategory === "TEAMS") {
      return n.type.includes("TEAM") || n.type.includes("INVITE");
    }
    if (filterCategory === "HACKATHONS") {
      return (
        n.type.includes("REGISTRATION") ||
        n.type.includes("HACKATHON") ||
        n.type.includes("DEADLINE") ||
        n.type.includes("ATTENDANCE") ||
        n.type.includes("CHECK_IN") ||
        n.type.includes("SCAN")
      );
    }
    if (filterCategory === "CERTIFICATES") {
      return n.type.includes("CERTIFICATE") || n.type.includes("AWARD");
    }
    return true;
  });

  const getIconForType = (type: string) => {
    const t = type.toUpperCase();
    if (
      t.includes("ATTENDANCE") ||
      t.includes("CHECK_IN") ||
      t.includes("CHECKIN") ||
      t.includes("SCAN") ||
      t.includes("QR")
    ) {
      return QrCode;
    }
    if (t.includes("TEAM") || t.includes("INVITE")) return Mail;
    if (t.includes("CERTIFICATE") || t.includes("AWARD")) return Award;
    if (t.includes("DEADLINE") || t.includes("SCHEDULE")) return Calendar;
    if (t.includes("ANNOUNCEMENT")) return Megaphone;
    if (t.includes("HACKATHON")) return Trophy;
    return Bell;
  };

  const getDeepLinkForNotification = (n: any) => {
    if (n.link) return n.link;
    const t = n.type.toUpperCase();
    if (t.includes("INVITE")) {
      if (n.data?.token) return `/team-invite/${n.data.token}`;
      return "/student/invitations";
    }
    if (t.includes("TEAM")) return "/student/teams";
    if (t.includes("CERTIFICATE")) return "/student/certificates";
    if (
      t.includes("ATTENDANCE") ||
      t.includes("CHECK_IN") ||
      t.includes("CHECKIN") ||
      t.includes("SCAN") ||
      t.includes("QR")
    ) {
      if (n.data?.hackathonId) return `/hackathons/${n.data.hackathonId}/check-in`;
      return "/student/hackathons";
    }
    if (n.data?.hackathonId) return `/hackathons/${n.data.hackathonId}`;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time updates on team invitations, registration status, deadlines, and results.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            <CheckCheck size={14} className="text-emerald-400" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 border-b border-[#1e2026] pb-3 overflow-x-auto no-scrollbar">
        {[
          { key: "ALL", label: `All (${notifications.length})` },
          { key: "TEAMS", label: "Teams & Invites" },
          { key: "HACKATHONS", label: "Hackathons & Deadlines" },
          { key: "CERTIFICATES", label: "Certificates & Awards" },
        ].map((cat) => {
          const isActive = filterCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-orange-500/15 text-[#F97316] border border-orange-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#14161b] border border-[#232630] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#F97316] flex items-center justify-center mx-auto">
            <Bell size={24} />
          </div>
          <h3 className="text-base font-display font-bold text-white">No Notifications</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You're all caught up! New updates regarding your events, teams, and awards will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const Icon = getIconForType(n.type);
            const isUnread = !n.readAt;
            const deepLink = getDeepLinkForNotification(n);
            const isAttendanceOrScan =
              n.type.toUpperCase().includes("ATTENDANCE") ||
              n.type.toUpperCase().includes("CHECK_IN") ||
              n.type.toUpperCase().includes("CHECKIN") ||
              n.type.toUpperCase().includes("SCAN") ||
              n.type.toUpperCase().includes("QR") ||
              Boolean(deepLink && deepLink.includes("check-in"));

            return (
              <div
                key={n.id}
                className={`p-4 md:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  isUnread
                    ? "bg-[#181a20] border-orange-500/30 shadow-sm"
                    : "bg-[#14161b] border-[#232630] hover:border-zinc-700"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isAttendanceOrScan
                      ? "bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-[#F97316] border border-orange-500/30 ring-2 ring-orange-500/10"
                      : isUnread
                      ? "bg-orange-500/15 text-[#F97316] border border-orange-500/20"
                      : "bg-white/[0.04] text-zinc-400"
                  }`}
                >
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold text-sm text-white truncate">
                      {n.title}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{n.body}</p>

                  <div className="flex items-center gap-3 pt-2">
                    {deepLink && (
                      <Link
                        href={deepLink}
                        onClick={() => {
                          if (isUnread) handleMarkOneRead(n.id);
                        }}
                        className="text-xs font-semibold text-[#F97316] hover:underline flex items-center gap-1.5"
                      >
                        {isAttendanceOrScan ? (
                          <>
                            <QrCode size={13} />
                            <span>Open Scanner</span>
                          </>
                        ) : (
                          <>
                            <span>View Details</span>
                            <ChevronRight size={13} />
                          </>
                        )}
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => handleMarkOneRead(n.id)}
                        className="text-[11px] font-medium text-zinc-400 hover:text-white"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Right side scanning icon / action */}
                {isAttendanceOrScan ? (
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    <Link
                      href={deepLink || "/student/hackathons"}
                      onClick={() => {
                        if (isUnread) handleMarkOneRead(n.id);
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all group"
                      title="Scan Projector QR Code"
                    >
                      <ScanLine size={16} className="animate-pulse" />
                      <span className="hidden sm:inline">Scan QR Code</span>
                    </Link>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0" />
                    )}
                  </div>
                ) : isUnread ? (
                  <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 mt-2" />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

