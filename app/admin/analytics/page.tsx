"use client";

import { BarChart3, TrendingUp, Users, Trophy, Building2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const metrics = [
    { title: "Weekly Active Hackers", value: "384", change: "+24.5%", icon: Users, color: "text-emerald-500" },
    { title: "Project Completion Rate", value: "78.2%", change: "+5.1%", icon: Trophy, color: "text-[#F97316]" },
    { title: "Host Organization Retention", value: "94.0%", change: "+1.8%", icon: Building2, color: "text-blue-500" },
    { title: "Avg. Team Formation Time", value: "1.4 days", change: "-18% vs avg", icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
          Platform Analytics & Insights
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
          Deep-dive engagement trends, participant geographic distributions, and velocity.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-secondary)]">{m.title}</span>
                <Icon size={18} className={m.color} />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)]">
                  {m.value}
                </div>
                <div className="text-[11px] font-medium text-emerald-500 mt-1">{m.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Visual Chart Placeholder */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
        <h3 className="font-display font-bold text-base text-[var(--text-primary)] mb-4">
          Hacker Growth & Global Submission Velocity
        </h3>
        <div className="h-64 flex items-center justify-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-canvas)]/50 text-xs text-[var(--text-secondary)]">
          <div className="text-center space-y-1">
            <BarChart3 size={32} className="mx-auto text-[#F97316] opacity-60" />
            <p className="font-medium text-[var(--text-primary)]">Real-time Telemetry Active</p>
            <p>Aggregating daily user check-ins, git commit webhooks, and judging rubric scores.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

