"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import {
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  Building2,
  GraduationCap,
  Scale,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";

interface VerificationItem {
  id: string;
  type: "STUDENT" | "COLLEGE_ORGANIZER" | "JUDGE";
  status: string;
  details: any;
  user: { id: string; name: string; email: string; createdAt: string };
  organization?: { id: string; name: string; slug: string };
  createdAt: string;
  hasIdCard: boolean;
}

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "JUDGE" | "COLLEGE_ORGANIZER" | "STUDENT">("ALL");

  // Rejection modal
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Document preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<VerificationItem[]>("/verifications/queue");
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load verification queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this verification request?")) return;
    setSubmittingAction(true);
    try {
      await apiFetch(`/verifications/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ decision: "APPROVE" }),
      });
      await fetchQueue();
    } catch (err: any) {
      alert(err.message || "Failed to approve request.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    if (!rejectionReason.trim()) {
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
      await fetchQueue();
    } catch (err: any) {
      alert(err.message || "Failed to reject request.");
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
      alert(err.message || "Could not generate secure document preview.");
    } finally {
      setLoadingDoc(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === "ALL") return true;
    return r.type === activeTab;
  });

  if (loading) return <LoadingState message="Loading verification queue..." />;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="text-orange-500" size={28} /> Verification Requests Queue
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Review proof of identity and credentials for students, college organizers, and judges.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#18191E] border border-[#272832] p-1 rounded-xl">
          {(["ALL", "JUDGE", "COLLEGE_ORGANIZER", "STUDENT"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === tab
                  ? "bg-orange-500 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab === "ALL" ? "All Queue" : tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <div className="bg-[#18191E] border border-[#272832] rounded-2xl p-12 text-center space-y-3">
          <ShieldCheck size={40} className="mx-auto text-zinc-600" />
          <h3 className="text-lg font-bold text-white">No pending requests</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            All verification requests have been processed. New submissions will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="bg-[#18191E] border border-[#272832] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#121316] border-b border-[#272832] text-zinc-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Requested Role</th>
                  <th className="py-3.5 px-4">Institution / Org</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">ID Proof</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272832]">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                    
                    {/* User */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-white text-sm">{req.details?.fullName || req.user.name}</p>
                      <p className="text-zinc-400 font-mono text-[11px]">{req.user.email}</p>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold ${
                        req.type === "STUDENT"
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : req.type === "COLLEGE_ORGANIZER"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}>
                        {req.type === "STUDENT" && <GraduationCap size={13} />}
                        {req.type === "COLLEGE_ORGANIZER" && <Building2 size={13} />}
                        {req.type === "JUDGE" && <Scale size={13} />}
                        {req.type}
                      </span>
                    </td>

                    {/* Institution */}
                    <td className="py-4 px-4 text-zinc-300">
                      {req.organization?.name || req.details?.newCollegeName || req.details?.organization || "-"}
                      {req.details?.newCollegeName && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                          New Request
                        </span>
                      )}
                    </td>

                    {/* Details breakdown */}
                    <td className="py-4 px-4 text-zinc-400 max-w-xs text-[11px]">
                      {req.type === "STUDENT" && (
                        <div>
                          <span>{req.details?.branch} • {req.details?.year}</span>
                          <span className="block font-mono text-zinc-500">Roll: {req.details?.rollNumber}</span>
                        </div>
                      )}
                      {req.type === "COLLEGE_ORGANIZER" && (
                        <div>
                          <span>{req.details?.designation}</span>
                          {req.details?.officialEmail && (
                            <span className="block font-mono text-zinc-500">{req.details?.officialEmail}</span>
                          )}
                        </div>
                      )}
                      {req.type === "JUDGE" && (
                        <div>
                          <span>{req.details?.designation}</span>
                          {req.details?.linkedinUrl && (
                            <a
                              href={req.details.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              LinkedIn <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      )}
                    </td>

                    {/* ID Proof link */}
                    <td className="py-4 px-4">
                      {req.hasIdCard ? (
                        <button
                          onClick={() => handleViewDocument(req.id)}
                          disabled={loadingDoc}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1.5 border border-zinc-700"
                        >
                          <FileText size={13} className="text-orange-400" /> Inspect ID
                        </button>
                      ) : (
                        <span className="text-zinc-600 font-mono">No document</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={submittingAction}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold flex items-center gap-1"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(req.id);
                            setRejectionReason("");
                          }}
                          disabled={submittingAction}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1"
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
          <div className="bg-[#18191E] border border-[#272832] rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Reject Verification Request</h3>
            <p className="text-xs text-zinc-400">
              Provide a clear reason explaining why this application was rejected. This will be sent to the user so they can correct it.
            </p>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. ID card photo is blurry. Please upload a clear photo showing your college roll number."
              className="w-full px-4 py-2.5 bg-[#121316] border border-[#272832] rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-xs text-zinc-300 hover:text-white"
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
          <div className="bg-[#18191E] border border-[#272832] rounded-2xl p-6 max-w-2xl w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[#272832] pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <FileText size={16} className="text-orange-400" /> Identification Document Preview
              </h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="min-h-[300px] max-h-[500px] overflow-auto flex items-center justify-center bg-black/40 rounded-xl p-4">
              {previewUrl.toLowerCase().includes(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-[450px] rounded-lg" title="ID Document" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="ID Document Proof" className="max-h-[450px] max-w-full rounded-lg object-contain" />
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-zinc-400 pt-2 font-mono">
              <span>Signed temporary URL (valid for 5 minutes)</span>
              <button
                onClick={() => setPreviewUrl(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs"
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
