"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import { Trophy, CheckCircle2, CircleDashed, Users, Lock } from "lucide-react";

export default function JudgingDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hackathon, setHackathon] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progData, leadData, hackData] = await Promise.all([
        apiFetch(`/hackathons/${id}/judging/progress`),
        apiFetch(`/hackathons/${id}/leaderboard`),
        apiFetch(`/hackathons/${id}`)
      ]);
      setProgress(progData as any[]);
      setLeaderboard(leadData as any[]);
      setHackathon(hackData as any);
    } catch (err: any) {
      setError(err.message || "Failed to load judging data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAutoAssign = async () => {
    if (!confirm("Auto-assign judges to all submitted projects? (2 judges per project)")) return;
    try {
      const res = await apiFetch(`/hackathons/${id}/judging/auto-assign`, {
        method: "POST",
        body: JSON.stringify({ judgesPerSubmission: 2 }),
      });
      alert(`Successfully created ${(res as any).assignmentsCreated} assignments!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to assign judges");
    }
  };

  const handleLockJudging = async () => {
    if (!confirm("Lock judging? This will prevent judges from modifying scores.")) return;
    try {
      await apiFetch(`/hackathons/${id}/judging/lock`, { method: "POST", body: JSON.stringify({ force: true }) });
      alert("Judging is now locked!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to lock judging");
    }
  };

  if (loading) return <LoadingState message="Loading judging dashboard..." />;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Judging Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] font-sans mt-2">
            Monitor judging progress, manage assignments, and view the leaderboard.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleAutoAssign}
            disabled={hackathon?.judgingLockedAt}
            className="px-6 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-xl font-bold font-sans transition-colors disabled:opacity-50"
          >
            Auto Assign
          </button>
          <ShinyButton
            variant={hackathon?.judgingLockedAt ? "secondary" : "primary"}
            onClick={handleLockJudging}
            disabled={hackathon?.judgingLockedAt}
            className="flex items-center gap-2"
          >
            <Lock size={16} /> {hackathon?.judgingLockedAt ? "Locked" : "Lock Judging"}
          </ShinyButton>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      {/* Progress Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Users size={20} className="text-orange-500" /> Judge Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progress.length === 0 ? (
            <div className="col-span-full p-8 text-center border border-[var(--border)] border-dashed rounded-2xl text-[var(--text-secondary)]">
              No active judges found. Add them in the Setup &gt; Staff tab.
            </div>
          ) : (
            progress.map((j: any) => {
              const p = j.totalAssigned > 0 ? Math.round((j.totalFinalized / j.totalAssigned) * 100) : 0;
              return (
                <div key={j.staffId} className="p-6 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl">
                  <div className="font-bold text-[var(--text-primary)]">{j.name}</div>
                  <div className="text-sm text-[var(--text-secondary)] truncate">{j.email}</div>
                  
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-display font-bold text-[#F97316]">{p}%</div>
                      <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Completed</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--text-primary)] flex items-center justify-end gap-1">
                        <CheckCircle2 size={14} className="text-green-500" /> {j.totalFinalized}
                      </div>
                      <div className="text-sm font-bold text-[var(--text-secondary)] flex items-center justify-end gap-1">
                        <CircleDashed size={14} /> {j.totalAssigned - j.totalFinalized}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Trophy size={20} className="text-orange-500" /> Live Leaderboard
        </h2>
        <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <table className="w-full text-left font-sans">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Project</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                    No scores available yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-6 py-4 font-bold text-[var(--text-secondary)]">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                      {item.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {item.teamName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-display font-bold text-[#F97316]">{item.score.toFixed(1)}%</div>
                      <div className="text-xs text-[var(--text-secondary)]">({item.judgesCount} judges)</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
