"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle2, XCircle, ShieldAlert, CheckCheck, Clock, ArrowRight, QrCode } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link?: string | null;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch<{ notifications: AppNotification[]; unreadCount: number }>(
        "/notifications"
      );
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Best effort - silently fail if offline or unauthorized
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await apiFetch("/notifications", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ATTENDANCE_SESSION_ACTIVE":
      case "ATTENDANCE":
        return <QrCode size={15} className="text-[#F97316]" />;
      case "VERIFICATION_REQUEST":
        return <ShieldAlert size={15} className="text-orange-500" />;
      case "VERIFICATION_APPROVED":
        return <CheckCircle2 size={15} className="text-emerald-500" />;
      case "VERIFICATION_REJECTED":
        return <XCircle size={15} className="text-red-500" />;
      default:
        return <Bell size={15} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        aria-label="Notifications"
        title="Notifications"
        className="relative w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#F97316]/40 flex items-center justify-center transition-colors shadow-sm"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F97316] text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-md animate-in zoom-in-75 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-0 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 font-sans overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-canvas)]/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-mono font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-[var(--text-secondary)] hover:text-[#F97316] flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={13} />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border)]/40">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center mx-auto mb-2">
                  <Bell size={18} />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">No notifications</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  You are all caught up with recent updates.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readAt;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (isUnread) markOneAsRead(n.id);
                      setOpen(false);
                      if (n.link) {
                        router.push(n.link);
                      } else if (n.type === "VERIFICATION_REQUEST") {
                        router.push("/admin/verifications");
                      }
                    }}
                    className={`p-3.5 hover:bg-[var(--bg-canvas)]/80 transition-colors flex items-start gap-3 cursor-pointer ${
                      isUnread ? "bg-orange-500/[0.03]" : ""
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold truncate ${isUnread ? "text-[var(--text-primary)] font-bold" : "text-[var(--text-secondary)]"}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono shrink-0">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      {n.body && (
                        <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      )}
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-canvas)]/30 text-center">
            <Link
              href="/admin/verifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-orange-500 hover:underline flex items-center justify-center gap-1"
            >
              <span>View Verification Queue</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
