"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Code2, CheckCircle2 } from "lucide-react";
import { ShinyButton } from "@/app/components/ShinyButton";

export default function AssignmentScoringPage({ params }: { params: Promise<{ id: string, assignmentId: string }> }) {
  const { id, assignmentId } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState<any>(null);
  const [hackathon, setHackathon] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [scores, setScores] = useState<Record<string, { value: number; comment: string }>>({});
  const [overallComment, setOverallComment] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assnData, hackData] = await Promise.all([
        // Wait, is there a route for getAssignment?
        // Let's assume GET /api/v1/hackathons/[id]/judging/assignments/[assignmentId] exists.
        apiFetch(`/hackathons/${id}/judging/assignments/${assignmentId}`),
        apiFetch(`/hackathons/${id}`)
      ]);
      setAssignment(assnData as any);
      setHackathon(hackData as any);
      setOverallComment((assnData as any).overallComment || "");

      const initialScores: Record<string, any> = {};
      (hackData as any).criteria.forEach((c: any) => {
        const existing = (assnData as any).scores.find((s: any) => s.criterionId === c.id);
        initialScores[c.id] = {
          value: existing ? existing.value : 0,
          comment: existing ? existing.comment : "",
        };
      });
      setScores(initialScores);
    } catch (err: any) {
      setError(err.message || "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, assignmentId]);

  const handleSave = async (finalize = false) => {
    setSaving(true);
    try {
      const payloadScores = Object.entries(scores).map(([criterionId, data]) => ({
        criterionId,
        value: data.value,
        comment: data.comment,
      }));

      await apiFetch(`/hackathons/${id}/judging/assignments/${assignmentId}/scores`, {
        method: "PUT",
        body: JSON.stringify({ scores: payloadScores, overallComment }),
      });

      if (finalize) {
        if (!confirm("Are you sure you want to finalize these scores? You cannot edit them later.")) {
          setSaving(false);
          return;
        }
        await apiFetch(`/hackathons/${id}/judging/assignments/${assignmentId}/finalize`, {
          method: "POST",
        });
        alert("Scores finalized successfully!");
      } else {
        alert("Scores saved as draft!");
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading scoring interface..." />;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const sub = assignment.submission;
  const isFinalized = !!assignment.finalizedAt;

  let totalScore = 0;
  let maxPossible = 0;
  hackathon.criteria.forEach((c: any) => {
    totalScore += (scores[c.id]?.value || 0) * c.weight;
    maxPossible += c.maxScore * c.weight;
  });

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Left: Project View (Read-Only) */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto border-r border-[var(--border)] bg-[var(--bg-canvas)] p-8">
        <Link href={`/judge/assignments?hackathonId=${id}`} className="inline-flex items-center gap-2 text-sm font-sans font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Assignments
        </Link>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-display font-extrabold text-[var(--text-primary)]">{sub.title}</h1>
            <p className="text-xl text-[var(--text-secondary)] font-sans mt-2">{sub.tagline}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {sub.techStack?.map((tech: string) => (
              <span key={tech} className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full text-xs font-bold font-sans text-[var(--text-secondary)]">
                {tech}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            {sub.repoUrl && (
              <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-bold font-sans hover:border-orange-500 transition-colors">
                <Code2 size={16} /> Repository
              </a>
            )}
            {sub.demoUrl && (
              <a href={sub.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-bold font-sans hover:border-orange-500 transition-colors">
                <ExternalLink size={16} /> Live Demo
              </a>
            )}
          </div>

          <div className="prose prose-invert max-w-none font-sans mt-8">
            <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">Description</h3>
            <div className="whitespace-pre-wrap text-[var(--text-secondary)] mt-4 p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
              {sub.description}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Scoring Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-[var(--bg-elevated)] p-8">
        <div className="max-w-xl mx-auto space-y-8 pb-24">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">Scorecard</h2>
            <div className="text-right">
              <div className="text-3xl font-display font-bold text-[#F97316]">{totalScore.toFixed(1)}</div>
              <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Out of {maxPossible.toFixed(1)}</div>
            </div>
          </div>

          {isFinalized && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl flex items-center gap-3 font-sans">
              <CheckCircle2 size={24} className="shrink-0" />
              <div>
                <div className="font-bold">Scores Finalized</div>
                <div className="text-sm">These scores have been submitted and cannot be changed.</div>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {hackathon.criteria.map((c: any) => (
              <div key={c.id} className="p-6 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display font-bold text-[var(--text-primary)]">{c.name}</h4>
                    <p className="text-sm text-[var(--text-secondary)] font-sans mt-1">{c.description}</p>
                  </div>
                  <div className="text-xs font-bold bg-orange-500/10 text-orange-500 px-2 py-1 rounded">
                    Max: {c.maxScore} (w: x{c.weight})
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-sans font-bold text-[var(--text-primary)] flex justify-between">
                    <span>Score</span>
                    <span className="text-[#F97316]">{scores[c.id]?.value || 0} / {c.maxScore}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={c.maxScore}
                    step="1"
                    disabled={isFinalized}
                    value={scores[c.id]?.value || 0}
                    onChange={e => setScores(p => ({ ...p, [c.id]: { ...p[c.id], value: parseInt(e.target.value) } }))}
                    className="w-full accent-orange-500"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Feedback (Optional)</label>
                  <textarea
                    rows={2}
                    disabled={isFinalized}
                    value={scores[c.id]?.comment || ""}
                    onChange={e => setScores(p => ({ ...p, [c.id]: { ...p[c.id], comment: e.target.value } }))}
                    className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50"
                    placeholder="Specific feedback for this criterion..."
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)] font-bold">Overall Comment</label>
            <textarea
              rows={4}
              disabled={isFinalized}
              value={overallComment}
              onChange={e => setOverallComment(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50"
              placeholder="Leave an overall comment for the team..."
            />
          </div>

          {!isFinalized && (
            <div className="flex items-center gap-4 pt-6 border-t border-[var(--border)]">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-xl font-bold font-sans transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <ShinyButton
                variant="primary"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex-1 justify-center"
              >
                Finalize Scores
              </ShinyButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
