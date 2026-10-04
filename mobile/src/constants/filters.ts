import type { HackathonFilter, HackathonSort } from "@/types/api";

export const FILTERS: { key: HackathonFilter; label: string }[] = [
  { key: "all", label: "All" }, { key: "live", label: "Live" }, { key: "open", label: "Open" },
  { key: "upcoming", label: "Upcoming" }, { key: "online", label: "Online" }, { key: "offline", label: "Offline" },
];
export const SORTS: { key: HackathonSort; label: string }[] = [
  { key: "date", label: "Date" }, { key: "prize", label: "Prize" }, { key: "participants", label: "Participants" },
];
