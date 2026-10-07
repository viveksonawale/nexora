"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import { Trophy, CheckCircle2, LockOpen } from "lucide-react";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hackathon, setHackathon] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadData, hackData] = await Promise.all([
        apiFetch(`/hackathons/${id}/leaderboard`),
        apiFetch(`/hackathons/${id}`)
      ]);
      setLeaderboard(leadData as any[]);
      setHackathon(hackData as any);
    } catch (err: any) {
      setError(err.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handlePublish = async () => {
    if (!confirm("Are you sure you want to publish results? This will make all projects and winners public.")) return;
    try {
      await apiFetch(`/hackathons/${id}/judging/publish`, { method: "POST" });
      alert("Results published successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to publish results");
    }
  };

  if (loading) return <LoadingState message="Loading results..." />;

  const isLocked = !!hackathon?.judgingLockedAt;
  const isPublished = !!hackathon?.resultsPublishedAt;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Results & Certificates
          </h1>
          <p className="text-[var(--text-secondary)] font-sans mt-2">
            Finalize judging and publish the winners to the public gallery.
          </p>
        </div>
        <div>
          <ShinyButton
            variant={isPublished ? "secondary" : "primary"}
            onClick={handlePublish}
            disabled={!isLocked || isPublished}
            className="flex items-center gap-2"
          >
            {isPublished ? (
              <><CheckCircle2 size={16} /> Published</>
            ) : (
              "Publish Results"
            )}
          </ShinyButton>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      {!isLocked && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl flex items-center gap-3 font-sans">
          <LockOpen size={24} className="shrink-0" />
          <div>
            <div className="font-bold">Judging is still open</div>
            <div className="text-sm">You must lock judging in the Judging tab before you can publish results.</div>
          </div>
        </div>
      )}

      <section className="space-y-6">
        <h2 className="text-xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Trophy size={20} className="text-orange-500" /> Final Leaderboard
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
                      {idx === 0 ? <span className="text-yellow-500">🏆 1st</span> :
                       idx === 1 ? <span className="text-gray-400">🥈 2nd</span> :
                       idx === 2 ? <span className="text-amber-600">🥉 3rd</span> :
                       `#${idx + 1}`}
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
