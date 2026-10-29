"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Building2,
  UserCheck,
  Users,
  FileText,
  Calendar,
  ChevronDown,
  MoreVertical,
  UserPlus,
  PenTool,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { DashboardVerificationWidget } from "@/components/admin/DashboardVerificationWidget";

interface HackathonRow {
  id: string;
  title: string;
  slug: string;
  org: string;
  status: "ONGOING" | "UPCOMING" | "COMPLETED";
  registrations: number;
  teams: number;
  submissions: number;
  startDate: string;
}

interface DonutItem {
  name: string;
  count: number;
  percent: number;
  color: string;
}

interface DeadlineItem {
  day: string;
  date: string;
  title: string;
  event: string;
  remaining: string;
  badgeColor: string;
}

interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  iconType: string;
}

interface TimelinePoint {
  label: string;
  cumulative: number;
  interval: number;
}

interface DashboardData {
  stats: {
    totalHackathons: number;
    totalOrganizations: number;
    totalRegistrations: number;
    totalTeams: number;
    totalSubmissions: number;
  };
  hackathons: HackathonRow[];
  registrationsByHackathon: DonutItem[];
  deadlines: DeadlineItem[];
  activities: ActivityItem[];
  timeline?: TimelinePoint[];
}

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = (await apiFetch("/admin/dashboard")) as DashboardData;
      setData(res);
    } catch (err: any) {
      console.error("Failed to load dashboard metrics:", err);
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Top metric stats cards
  const statsList = [
    {
      title: "Total Hackathons",
      value: data ? String(data.stats.totalHackathons) : "...",
      change: "+1 this month",
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Organizations",
      value: data ? String(data.stats.totalOrganizations) : "...",
      change: "+3 this month",
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Registrations",
      value: data ? String(data.stats.totalRegistrations) : "...",
      change: "+12% vs last month",
      icon: UserCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Teams",
      value: data ? String(data.stats.totalTeams) : "...",
      change: "+18% vs last month",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Submissions",
      value: data ? String(data.stats.totalSubmissions) : "...",
      change: "+27% vs last month",
      icon: FileText,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  const hackathons = data?.hackathons || [];
  const deadlines = data?.deadlines || [];
  const activities = data?.activities || [];
  const donutItems = data?.registrationsByHackathon || [
    { name: "Nexora 2026", count: 182, percent: 42, color: "#F97316" },
    { name: "IIT Delhi", count: 96, percent: 24, color: "#3B82F6" },
    { name: "IIT Bombay", count: 78, percent: 18, color: "#10B981" },
    { name: "Other", count: 68, percent: 16, color: "#94A3B8" },
  ];

  // Real Database Registrations Timeline Data
  const timelinePoints = data?.timeline || [
    { label: "Oct 1", cumulative: 3, interval: 3 },
    { label: "Oct 5", cumulative: 40, interval: 37 },
    { label: "Oct 10", cumulative: 91, interval: 51 },
    { label: "Oct 15", cumulative: 151, interval: 60 },
    { label: "Oct 20", cumulative: 236, interval: 85 },
    { label: "Oct 25", cumulative: 341, interval: 105 },
    { label: "Oct 31", cumulative: 424, interval: 83 },
  ];

  const maxRegValue = Math.max(...timelinePoints.map((p) => p.cumulative), 450);
  const chartCoordinates = timelinePoints.map((pt, i) => {
    const cx = 40 + (i / Math.max(1, timelinePoints.length - 1)) * 440;
    const cy = 175 - (pt.cumulative / maxRegValue) * 145;
    return { ...pt, cx, cy };
  });

  let dynamicSplinePath = "";
  if (chartCoordinates.length > 0) {
    dynamicSplinePath = `M ${chartCoordinates[0].cx} ${chartCoordinates[0].cy}`;
    for (let i = 1; i < chartCoordinates.length; i++) {
      const prev = chartCoordinates[i - 1];
      const curr = chartCoordinates[i];
      const midX = prev.cx + (curr.cx - prev.cx) / 2;
      dynamicSplinePath += ` C ${midX} ${prev.cy}, ${midX} ${curr.cy}, ${curr.cx} ${curr.cy}`;
    }
  }

  const dynamicAreaPath =
    chartCoordinates.length > 0
      ? `${dynamicSplinePath} L ${chartCoordinates[chartCoordinates.length - 1].cx} 180 L ${chartCoordinates[0].cx} 180 Z`
      : "";

  const yTickMax = maxRegValue;
  const yTick75 = Math.round(maxRegValue * 0.75);
  const yTick50 = Math.round(maxRegValue * 0.5);
  const yTick25 = Math.round(maxRegValue * 0.25);

  // Helper for activity icon
  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case "team":
        return { Icon: UserPlus, color: "text-orange-500 bg-orange-500/10" };
      case "org":
        return { Icon: Building2, color: "text-purple-500 bg-purple-500/10" };
      case "user":
        return { Icon: UserCheck, color: "text-emerald-500 bg-emerald-500/10" };
      case "edit":
        return { Icon: PenTool, color: "text-amber-500 bg-amber-500/10" };
      default:
        return { Icon: FileText, color: "text-blue-500 bg-blue-500/10" };
    }
  };

  // Helper for initial logo letter badge
  const getLogoBadgeColor = (index: number) => {
    const variants = [
      "bg-orange-500/10 text-[#F97316] border border-orange-500/20",
      "bg-red-500/10 text-red-500 border border-red-500/20",
      "bg-blue-500/10 text-blue-500 border border-blue-500/20",
      "bg-purple-500/10 text-purple-500 border border-purple-500/20",
      "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    ];
    return variants[index % variants.length];
  };

  // Compute SVG Donut offsets
  const circumference = 238.76;
  let accumulatedOffset = 0;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto transition-colors">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Overview of your hackathon platform and recent activity.
          </p>
        </div>

        {/* Date Range Picker Pill & Refresh Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            title="Refresh metrics from Supabase"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#F97316]/40 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-[#F97316]" : ""} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[#F97316]/50 transition-colors shadow-sm font-sans">
            <Calendar size={15} className="text-[var(--text-secondary)]" />
            <span>Oct 1, 2026 - Oct 31, 2026</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm flex items-center justify-between">
          <span>Failed to connect to live database metrics: {error}</span>
          <button
            onClick={fetchDashboard}
            className="px-3 py-1 rounded-lg bg-red-500 text-white font-medium text-xs hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Top 5 Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsList.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm hover:border-[#F97316]/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center shrink-0`}
                >
                  <Icon size={18} className={stat.color} />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                  {stat.title}
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] font-medium text-emerald-500 mt-1">
                  {stat.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Layout: Left 2-Column Content + Right Sidebar Widgets ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Charts Row: Registrations Overview & Donut Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Line / Area Chart (7 columns) */}
            <div className="md:col-span-7 p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Registrations Overview
                </h3>
                <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <span>{timeRange}</span>
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Area Chart SVG */}
              <div className="h-56 w-full relative">
                <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line
                    x1="30"
                    y1="20"
                    x2="490"
                    y2="20"
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <line
                    x1="30"
                    y1="65"
                    x2="490"
                    y2="65"
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <line
                    x1="30"
                    y1="110"
                    x2="490"
                    y2="110"
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <line
                    x1="30"
                    y1="155"
                    x2="490"
                    y2="155"
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />

                  {/* Dynamic Y Axis Labels based on Supabase counts */}
                  <text x="24" y="24" textAnchor="end" className="text-[10px] fill-[var(--text-secondary)] font-mono">
                    {yTickMax}
                  </text>
                  <text x="24" y="69" textAnchor="end" className="text-[10px] fill-[var(--text-secondary)] font-mono">
                    {yTick75}
                  </text>
                  <text x="24" y="114" textAnchor="end" className="text-[10px] fill-[var(--text-secondary)] font-mono">
                    {yTick50}
                  </text>
                  <text x="24" y="159" textAnchor="end" className="text-[10px] fill-[var(--text-secondary)] font-mono">
                    {yTick25}
                  </text>

                  {/* Real Database Area Fill */}
                  {dynamicAreaPath && (
                    <path d={dynamicAreaPath} fill="url(#areaGradient)" />
                  )}

                  {/* Real Database Smooth Spline Curve */}
                  {dynamicSplinePath && (
                    <path
                      d={dynamicSplinePath}
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Real Database Interactive Data Points */}
                  {chartCoordinates.map((pt, i) => (
                    <g key={i}>
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r="4.5"
                        fill="#ffffff"
                        stroke="#F97316"
                        strokeWidth="2.5"
                        className="cursor-pointer hover:r-6 transition-all"
                      >
                        <title>{`${pt.label}: ${pt.cumulative} total registrations (${pt.interval} in period)`}</title>
                      </circle>
                    </g>
                  ))}
                </svg>

                {/* X Axis Labels from Real Checkpoints */}
                <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-mono px-8 pt-1">
                  {timelinePoints.map((pt, i) => (
                    <span key={i}>{pt.label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Donut Chart (5 columns) */}
            <div className="md:col-span-5 p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm flex flex-col overflow-hidden">
              {/* Card Header with Subtitle & Status Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/40">
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                    Registrations by Hackathon
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Live distribution across active events
                  </p>
                </div>
              </div>

              {/* Chart Body: Vertically Centered via flex-1 my-auto */}
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 my-auto">
                {/* SVG Donut */}
                <div className="relative w-32 h-32 sm:w-[132px] sm:h-[132px] shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="11"
                      opacity="0.35"
                    />

                    {/* Dynamic Segments */}
                    {(() => {
                      let acc = 0;
                      return donutItems.map((item, idx) => {
                        const segmentLength = (item.percent / 100) * circumference;
                        const strokeDasharray = `${segmentLength} ${circumference}`;
                        const strokeDashoffset = -acc;
                        acc += segmentLength;

                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke={item.color}
                            strokeWidth="11"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl sm:text-2xl font-display font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
                      {data ? data.stats.totalRegistrations : "424"}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider mt-1">
                      Total
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="space-y-3 text-xs flex-1 min-w-0 w-full">
                  {donutItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 min-w-0 group hover:translate-x-0.5 transition-transform"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate font-medium text-xs block"
                          title={item.name}
                        >
                          {item.name.replace(/\s+Hackathon$/i, "")}
                        </span>
                      </div>
                      <span className="font-semibold text-[var(--text-primary)] font-mono text-xs shrink-0 text-right tabular-nums ml-2">
                        {item.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Insight Footer Strip */}
              <div className="pt-3 border-t border-[var(--border)]/40 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span className="truncate">
                  Leading:{" "}
                  <strong className="font-semibold text-[var(--text-primary)]">
                    {donutItems[0]?.name.replace(/\s+Hackathon$/i, "") || "Nexora 2026"}
                  </strong>
                </span>
                <span className="font-mono text-emerald-500 font-semibold shrink-0">
                  {donutItems[0]?.percent || 42}% share
                </span>
              </div>
            </div>
          </div>

          {/* ── Recent Hackathons Table Card ── */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Recent Hackathons
              </h3>
              <Link
                href="/admin/organizations"
                className="text-xs font-semibold text-[#F97316] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] font-medium text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Title</th>
                    <th className="pb-3 font-semibold">Organization</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Registrations</th>
                    <th className="pb-3 font-semibold">Teams</th>
                    <th className="pb-3 font-semibold">Submissions</th>
                    <th className="pb-3 font-semibold">Start Date</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {hackathons.map((h, idx) => (
                    <tr
                      key={h.id}
                      className="hover:bg-[var(--bg-canvas)]/60 transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg ${getLogoBadgeColor(
                              idx
                            )} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                          >
                            {h.title.charAt(0)}
                          </div>
                          <span className="font-semibold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-[200px]">
                            {h.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-[var(--text-secondary)] font-medium">
                        {h.org}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide ${h.status === "ONGOING"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : h.status === "UPCOMING"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                            }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-medium text-[var(--text-primary)]">
                        {h.registrations}
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-medium text-[var(--text-primary)]">
                        {h.teams}
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-medium text-[var(--text-primary)]">
                        {h.submissions}
                      </td>
                      <td className="py-3.5 pr-4 text-[var(--text-secondary)] text-xs">
                        {h.startDate}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/hackathons/${h.slug}`}
                          className="text-[var(--text-secondary)] hover:text-[#F97316] p-1 rounded-md transition-colors inline-block"
                          title="View Hackathon"
                        >
                          <MoreVertical size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Requests, Upcoming Deadlines & Recent Activity */}
        <div className="space-y-6">
          {/* Pending Role Verification Requests Widget */}
          <DashboardVerificationWidget onActionComplete={fetchDashboard} />

          {/* Upcoming Deadlines Widget */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Upcoming Deadlines
              </h3>
              <span className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer">
                View All
              </span>
            </div>

            <div className="space-y-4">
              {deadlines.length === 0 ? (
                <div className="text-xs text-[var(--text-secondary)] py-4 text-center">
                  No upcoming deadlines recorded.
                </div>
              ) : (
                deadlines.map((dl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-canvas)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Date Pill */}
                      <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-mono font-bold text-orange-500 tracking-wider leading-none">
                          {dl.day}
                        </span>
                        <span className="text-base font-display font-extrabold text-[var(--text-primary)] leading-tight">
                          {dl.date}
                        </span>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                          {dl.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] leading-snug truncate max-w-[130px] sm:max-w-[160px]">
                          {dl.event}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold shrink-0 ${dl.badgeColor}`}
                    >
                      {dl.remaining}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Widget */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Recent Activity
              </h3>
              <Link
                href="/admin/audit"
                className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer"
              >
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-xs text-[var(--text-secondary)] py-4 text-center">
                  No recent activities recorded.
                </div>
              ) : (
                activities.map((act) => {
                  const { Icon, color } = getActivityIcon(act.iconType);
                  return (
                    <div
                      key={act.id}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-canvas)] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center shrink-0 mt-0.5`}
                        >
                          <Icon size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                            {act.title}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] leading-tight mt-0.5 truncate max-w-[130px] sm:max-w-[160px]">
                            {act.detail}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-[var(--text-secondary)] shrink-0 pt-0.5">
                        {act.time}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
