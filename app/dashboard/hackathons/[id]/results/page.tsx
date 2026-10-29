"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Trophy,
  CheckCircle2,
  LockOpen,
  Award,
  Download,
  FileArchive,
  Ban,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hackathon, setHackathon] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadData, hackData, certData] = await Promise.all([
        apiFetch(`/hackathons/${id}/leaderboard`).catch(() => []),
        apiFetch(`/hackathons/${id}`).catch(() => null),
        apiFetch(`/hackathons/${id}/certificates`).catch(() => []),
      ]);
      setLeaderboard(Array.isArray(leadData) ? leadData : []);
      setHackathon(hackData);
      setCertificates(Array.isArray(certData) ? certData : []);
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

  const handleIssueCertificates = async () => {
    if (!confirm("Issue certificates for all eligible participants and winners?")) return;
    setIssuing(true);
    try {
      const res: any = await apiFetch(`/hackathons/${id}/certificates/issue`, {
        method: "POST",
        body: JSON.stringify({
          types: ["PARTICIPATION", "WINNER", "RUNNER_UP", "ACHIEVEMENT"],
        }),
      });
      alert(`Certificates issued successfully! (${res.count} generated)`);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to issue certificates");
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async (certId: string, recipientName: string) => {
    const reason = prompt(`Enter revocation reason for ${recipientName}'s certificate:`, "Revoked by organizer");
    if (reason === null) return;
    try {
      await apiFetch(`/hackathons/${id}/certificates/${certId}/revoke`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      alert("Certificate revoked successfully.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke certificate");
    }
  };

  if (loading) return <LoadingState message="Loading results & certificates..." />;

  const isLocked = !!hackathon?.judgingLockedAt;
  const isPublished = !!hackathon?.resultsPublishedAt;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Results & Certificates
          </h1>
          <p className="text-[var(--text-secondary)] font-sans mt-2">
            Finalize judging, publish winners, and manage official digital certificates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPublished && (
            <ShinyButton
              variant="secondary"
              onClick={handleIssueCertificates}
              disabled={issuing}
              className="flex items-center gap-2 text-xs"
            >
              <Award size={15} className="text-[#EA580C]" />
              <span>{issuing ? "Issuing..." : "Issue Certificates"}</span>
            </ShinyButton>
          )}

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

      {/* Leaderboard Section */}
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

      {/* Certificates Management Section */}
      <section className="space-y-6 pt-4 border-t border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Award size={20} className="text-[#EA580C]" /> Participant & Winner Certificates
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-sans mt-1">
              Cryptographically verified, immutable PDF credentials issued for verified attendees and prize winners.
            </p>
          </div>

          {certificates.length > 0 && (
            <a
              href={`/api/v1/hackathons/${id}/certificates/zip`}
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] transition-colors shadow-sm"
            >
              <FileArchive size={15} className="text-[#EA580C]" />
              <span>Download All as ZIP</span>
            </a>
          )}
        </div>

        <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left font-sans text-xs sm:text-sm">
            <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Certificate ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {certificates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                    {isPublished
                      ? "No certificates issued yet. Click 'Issue Certificates' above to generate certificates."
                      : "Publish hackathon results first to enable certificate generation."}
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => {
                  const isIssued = cert.status === "ISSUED";
                  const isRevoked = cert.status === "REVOKED";

                  return (
                    <tr key={cert.id} className="hover:bg-[var(--bg-elevated)]/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {cert.recipientName || cert.user?.name || "Participant"}
                        </div>
                        {cert.position && (
                          <div className="text-[11px] text-[#EA580C] font-medium">
                            {cert.position}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
                          {cert.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)]">
                        {cert.certificateId}
                      </td>
                      <td className="px-6 py-4">
                        {isIssued && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <ShieldCheck size={12} />
                            ISSUED
                          </span>
                        )}
                        {isRevoked && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                            <Ban size={12} />
                            REVOKED
                          </span>
                        )}
                        {!isIssued && !isRevoked && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isIssued && (
                            <a
                              href={`/api/v1/certificates/${cert.id}/download`}
                              download
                              title="Download PDF"
                              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[#EA580C] hover:bg-[var(--border)] transition-colors"
                            >
                              <Download size={15} />
                            </a>
                          )}

                          <a
                            href={`/certificates/verify/${cert.verificationCode}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Verify in public portal"
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
                          >
                            <ExternalLink size={15} />
                          </a>

                          {isIssued && (
                            <button
                              onClick={() => handleRevoke(cert.id, cert.recipientName)}
                              title="Revoke Certificate"
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Ban size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
