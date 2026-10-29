"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShieldCheck, Trophy, CheckCircle, Scale, EyeOff, Award } from "lucide-react";

export default function AdminJudgingPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/hackathons")
      .then((data: any) => setHackathons(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading judging configuration..." />;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
          Judging & Evaluation Overview
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
          Monitor blind evaluation integrity, rubrics, and judge assignments across active hackathons.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <EyeOff size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] font-medium">Blind Evaluation</div>
            <div className="text-xl font-bold font-display text-[var(--text-primary)]">Enforced (100%)</div>
            <div className="text-[11px] text-emerald-500 mt-0.5">Author info stripped during scoring</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Scale size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] font-medium">Scoring Standard</div>
            <div className="text-xl font-bold font-display text-[var(--text-primary)]">Weighted Normalized</div>
            <div className="text-[11px] text-blue-500 mt-0.5">Z-score normalization active</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--text-secondary)] font-medium">Track Rubrics</div>
            <div className="text-xl font-bold font-display text-[var(--text-primary)]">Configured</div>
            <div className="text-[11px] text-orange-500 mt-0.5">Technical execution weighted 1.5x</div>
          </div>
        </div>
      </div>

      {/* Hackathons Table for Judging */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
            Active Judging Pipelines
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--bg-canvas)]/40 border-b border-[var(--border)] text-[var(--text-secondary)] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Hackathon</th>
                <th className="px-6 py-4 font-semibold">Organization</th>
                <th className="px-6 py-4 font-semibold">Submissions to Judge</th>
                <th className="px-6 py-4 font-semibold">Blind Judging</th>
                <th className="px-6 py-4 font-semibold">Phase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {hackathons.map((h) => (
                <tr key={h.id} className="hover:bg-[var(--bg-canvas)]/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#F97316] border border-orange-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                        <Trophy size={15} />
                      </div>
                      <span className="font-semibold text-[var(--text-primary)]">{h.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                    {h.organization?.name || "Nexora"}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-[var(--text-primary)]">
                    {h._count?.submissions ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle size={12} />
                      ENABLED
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      EVALUATION
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

