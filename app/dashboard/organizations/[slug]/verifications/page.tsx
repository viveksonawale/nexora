"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import {
  ShieldCheck,
  Check,
  X,
  FileText,
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Building2,
} from "lucide-react";

interface VerificationItem {
  id: string;
  type: "STUDENT" | "COLLEGE_ORGANIZER";
  status: string;
  details: any;
  user: { id: string; name: string; email: string; createdAt: string };
  organization?: { id: string; name: string; slug: string };
  createdAt: string;
  hasIdCard: boolean;
}

export default function CollegeVerificationQueuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [org, setOrg] = useState<any>(null);
  const [requests, setRequests] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reject modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Document preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const fetchQueue = async (orgId: string) => {
    try {
      const data = await apiFetch<VerificationItem[]>(`/verifications/queue?orgId=${orgId}`);
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load verification queue.");
    }
  };

  useEffect(() => {
    apiFetch<any>(`/organizations/${slug}`)
      .then((orgData) => {
        setOrg(orgData);
        return fetchQueue(orgData.id);
      })
      .catch((err) => setError(err.message || "Could not load organization"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this student/organizer?")) return;
    setSubmittingAction(true);
    try {
      await apiFetch(`/verifications/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision: "APPROVE" }),
      });
      if (org) await fetchQueue(org.id);
    } catch (err: any) {
      alert(err.message || "Failed to approve verification.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId || !rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setSubmittingAction(true);
    try {
      await apiFetch(`/verifications/${rejectingId}/review`, {
        method: "POST",
        body: JSON.stringify({ decision: "REJECT", rejectionReason: rejectionReason.trim() }),
      });
      setRejectingId(null);
      setRejectionReason("");
      if (org) await fetchQueue(org.id);
    } catch (err: any) {
      alert(err.message || "Failed to reject verification.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleViewDocument = async (id: string) => {
    setLoadingDoc(true);
    try {
      const { signedUrl } = await apiFetch<{ signedUrl: string }>(`/verifications/${id}/document`);
      if (signedUrl) {
        setPreviewUrl(signedUrl);
      }
    } catch (err: any) {
      alert(err.message || "Failed to load document.");
    } finally {
      setLoadingDoc(false);
    }
  };

  if (loading) return <LoadingState message="Loading college review queue..." />;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <Link
            href={`/dashboard/organizations/${slug}`}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={13} /> Back to {org?.name}
          </Link>
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldCheck size={26} className="text-orange-500" /> Student & Organizer Verifications
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
            Verify student college IDs to unlock verified certificates and resume credentials.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Requests */}
      {requests.length === 0 ? (
        <div className="p-12 text-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl space-y-3">
          <ShieldCheck size={40} className="mx-auto text-[var(--text-secondary)]" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Queue is clear!</h3>
          <p className="text-xs text-[var(--text-secondary)] font-sans max-w-sm mx-auto">
            All verification requests for {org?.name} have been processed.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[var(--bg-canvas)] border-b border-[var(--border)] text-[var(--text-secondary)] font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Standing</th>
                  <th className="py-3 px-4">Academic Details</th>
                  <th className="py-3 px-4">ID Card Proof</th>
                  <th className="py-3 px-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[var(--bg-canvas)]/40 transition-colors">
                    
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[var(--text-primary)] text-sm">{req.details?.fullName || req.user.name}</p>
                      <p className="text-[var(--text-secondary)] font-mono text-[11px]">{req.user.email}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        req.type === "STUDENT"
                          ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}>
                        {req.type === "STUDENT" ? <GraduationCap size={13} /> : <Building2 size={13} />}
                        {req.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[var(--text-secondary)] text-[11px]">
                      {req.type === "STUDENT" ? (
                        <div>
                          <span className="font-medium text-[var(--text-primary)]">{req.details?.branch}</span>
                          <span className="block font-mono">Year: {req.details?.year} • Roll: {req.details?.rollNumber}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-[var(--text-primary)]">{req.details?.designation}</span>
                          {req.details?.officialEmail && (
                            <span className="block font-mono">{req.details.officialEmail}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {req.hasIdCard ? (
                        <button
                          onClick={() => handleViewDocument(req.id)}
                          disabled={loadingDoc}
                          className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <FileText size={13} className="text-orange-500" /> Preview ID
                        </button>
                      ) : (
                        <span className="text-[var(--text-secondary)] font-mono">No document</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={submittingAction}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 text-xs font-semibold flex items-center gap-1"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(req.id);
                            setRejectionReason("");
                          }}
                          disabled={submittingAction}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-semibold flex items-center gap-1"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Reject Request</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Specify why the ID card or student details could not be verified. The student will be prompted to correct and resubmit.
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Student ID card photo is illegible. Please submit an official college photo ID."
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-orange-500 resize-none font-sans"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={submittingAction || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
                <FileText size={16} className="text-orange-500" /> College Identification Document
              </h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="min-h-[300px] max-h-[500px] overflow-auto flex items-center justify-center bg-[var(--bg-canvas)] rounded-xl p-4">
              {previewUrl.toLowerCase().includes(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-[450px] rounded-lg" title="ID Document" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="ID Document Proof" className="max-h-[450px] max-w-full rounded-lg object-contain" />
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] pt-2 font-mono">
              <span>Secure temporary signed URL (5-minute expiry)</span>
              <button
                onClick={() => setPreviewUrl(null)}
                className="px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
