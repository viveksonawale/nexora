import type { HackathonMode, HackathonStatus } from "@/types/api";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
export function formatPrize(amount: number, currency = "INR") {
  if (!amount) return "No prize";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
export const statusLabel: Record<HackathonStatus, string> = { LIVE: "Live", OPEN: "Open", UPCOMING: "Upcoming", ENDED: "Ended" };
export const modeLabel: Record<HackathonMode, string> = { ONLINE: "Online", OFFLINE: "Offline", HYBRID: "Hybrid" };

/** Parses "YYYY-MM-DD" or "YYYY-MM-DD HH:mm" as local time. Returns null when invalid. */
export function parseLocalDateTime(v: string, defaultHour = 9): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(v.trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : defaultHour, m[5] ? +m[5] : 0);
  return Number.isNaN(d.getTime()) || d.getMonth() !== +m[2] - 1 ? null : d;
}
