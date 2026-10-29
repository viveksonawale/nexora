"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Eye,
  Building2,
  Scale,
  FileText,
  ExternalLink,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface VerificationItem {
  id: string;
  type: "COLLEGE_ORGANIZER" | "JUDGE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  details: {
    fullName: string;
    designation?: string;
    officialEmail?: string;
    newCollegeName?: string;
    organization?: string;
    expertiseAreas?: string[];
    linkedinUrl?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: string;
  hasIdCard: boolean;
}

export function DashboardVerificationWidget({
  onActionComplete,
}: {
  onActionComplete?: () => void;
}) {
  const [requests, setRequests] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalRequest, setActiveModalRequest] = useState<VerificationItem | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<VerificationItem[]>("/verifications/queue");
      setRequests(data || []);
    } catch {
      // Best effort
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openReviewModal = async (req: VerificationItem) => {
    setActiveModalRequest(req);
    setActionError(null);
    setActionSuccess(null);
    setRejectionReason("");
    setDocumentUrl(null);

    if (req.hasIdCard) {
      setDocLoading(true);
      try {
        const docRes = await apiFetch<{ signedUrl: string }>(
          `/verifications/${req.id}/document`
        );
        setDocumentUrl(docRes.signedUrl);
      } catch (err: any) {
        console.error("Failed to load document:", err);
      } finally {
        setDocLoading(false);
      }
    }
  };

  const handleReview = async (
    requestId: string,
    decision: "APPROVE" | "REJECT",
    reason?: string
  ) => {
    setProcessingId(requestId);
    setActionError(null);

    try {
      await apiFetch(`/verifications/${requestId}/review`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          rejectionReason: reason || (decision === "REJECT" ? "Requirements not met" : undefined),
        }),
      });

      setActionSuccess(
        decision === "APPROVE" ? "Request approved successfully!" : "Request rejected."
      );

      // Optimistically update list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      if (onActionComplete) onActionComplete();

      setTimeout(() => {
        if (activeModalRequest?.id === requestId) {
          setActiveModalRequest(null);
        }
      }, 1200);
    } catch (err: any) {
      setActionError(err.message || "Failed to process verification decision.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <>
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm font-sans">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]/40 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                Verification Requests
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Review & approve organizer and judge applications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {requests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-mono font-bold">
                {requests.length} Pending
              </span>
            )}
            <Link
              href="/admin/verifications"
              className="text-xs font-semibold text-[#F97316] hover:underline flex items-center gap-0.5 ml-1"
            >
              <span>Queue</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Action alert message */}
        {actionSuccess && !activeModalRequest && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check size={14} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck size={20} />
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                All Caught Up!
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                No pending organizer or judge requests awaiting review.
              </p>
            </div>
          ) : (
            requests.slice(0, 4).map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)]/60 hover:bg-[var(--bg-canvas)] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#18181b] border border-[var(--border)] text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {req.details.fullName?.charAt(0) || req.user.name?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {req.details.fullName || req.user.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">
                        {req.organization?.name ||
                          req.details.newCollegeName ||
                          req.details.organization ||
                          "Platform Applicant"}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold shrink-0 ${
                      req.type === "COLLEGE_ORGANIZER"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {req.type === "COLLEGE_ORGANIZER" ? "ORGANIZER" : "JUDGE"}
                  </span>
                </div>

                {/* Footer Controls: Review Pop-up & Quick Decisions */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/40 text-xs">
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    {formatTimeAgo(req.createdAt)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openReviewModal(req)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500/50 text-[var(--text-primary)] text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title="View Applicant Info & ID"
                    >
                      <Eye size={12} className="text-orange-500" />
                      <span>Review</span>
                    </button>

                    <button
                      disabled={processingId === req.id}
                      onClick={() => handleReview(req.id, "APPROVE")}
                      className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Quick Approve"
                    >
                      <Check size={14} />
                    </button>

                    <button
                      disabled={processingId === req.id}
                      onClick={() => openReviewModal(req)}
                      className="p-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Decline"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= MODAL / POP-UP: APPLICANT INFO & ID ================= */}
      {activeModalRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      activeModalRequest.type === "COLLEGE_ORGANIZER"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {activeModalRequest.type.replace("_", " ")}
                  </span>
                  <span className="text-xs font-mono text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    Pending Review
                  </span>
                </div>
                <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mt-1.5">
                  Review Role Verification
                </h2>
              </div>
              <button
                onClick={() => setActiveModalRequest(null)}
                className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error or Success notification inside modal */}
            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check size={15} />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Applicant Information Section */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#18181b] border border-[var(--border)] text-white font-bold text-lg flex items-center justify-center">
                    {activeModalRequest.details.fullName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      {activeModalRequest.details.fullName}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">
                      {activeModalRequest.user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)] text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                      Institution / Org
                    </span>
                    <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                      {activeModalRequest.organization?.name ||
                        activeModalRequest.details.newCollegeName ||
                        activeModalRequest.details.organization ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                      Designation / Title
                    </span>
                    <p className="font-semibold text-[var(--text-primary)] mt-0.5">
                      {activeModalRequest.details.designation || "N/A"}
                    </p>
                  </div>

                  {activeModalRequest.details.officialEmail && (
                    <div className="col-span-2">
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                        Official Email
                      </span>
                      <p className="font-semibold text-[var(--text-primary)] mt-0.5 font-mono">
                        {activeModalRequest.details.officialEmail}
                      </p>
                    </div>
                  )}

                  {activeModalRequest.details.linkedinUrl && (
                    <div className="col-span-2">
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">
                        LinkedIn Profile
                      </span>
                      <a
                        href={activeModalRequest.details.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-500 hover:underline flex items-center gap-1 font-semibold mt-0.5"
                      >
                        <span>{activeModalRequest.details.linkedinUrl}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {activeModalRequest.details.expertiseAreas &&
                    activeModalRequest.details.expertiseAreas.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block mb-1">
                          Areas of Expertise
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeModalRequest.details.expertiseAreas.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] font-mono"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* ID Proof Document Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                    <Lock size={12} className="text-emerald-500" />
                    Identification Proof Document
                  </span>
                  {documentUrl && (
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-orange-500 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Open Full Size</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] min-h-[140px] flex items-center justify-center">
                  {docLoading ? (
                    <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                      <Clock size={14} className="animate-spin text-orange-500" />
                      Loading encrypted document preview...
                    </div>
                  ) : documentUrl ? (
                    documentUrl.includes(".pdf") ? (
                      <div className="text-center py-4 space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                          <FileText size={24} />
                        </div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          PDF Verification Document Attached
                        </p>
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-xs font-semibold text-orange-500 hover:border-orange-500"
                        >
                          View Document in New Tab <ExternalLink size={12} />
                        </a>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={documentUrl}
                        alt="ID Document Preview"
                        className="max-h-60 rounded-lg object-contain border border-[var(--border)] shadow-sm mx-auto"
                      />
                    )
                  ) : (
                    <div className="text-xs text-[var(--text-secondary)]">
                      No document proof uploaded or unable to load preview.
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason Input (Optional/Required if declining) */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--text-secondary)] uppercase">
                  Rejection Reason (Required if declining)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Unclear ID photo or institution domain does not match official record"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                disabled={processingId === activeModalRequest.id}
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    setActionError("Please enter a rejection reason before declining.");
                    return;
                  }
                  handleReview(activeModalRequest.id, "REJECT", rejectionReason);
                }}
                className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <X size={14} />
                <span>Decline Request</span>
              </button>

              <button
                type="button"
                disabled={processingId === activeModalRequest.id}
                onClick={() => handleReview(activeModalRequest.id, "APPROVE")}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Check size={14} />
                <span>Approve & Verify</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
