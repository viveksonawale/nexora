"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { Megaphone, Plus, Trash2, Pin, Clock, Send, AlertCircle, Check } from "lucide-react";

export default function OrganizerAnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/hackathons/${id}/announcements`);
      setAnnouncements(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      await apiFetch(`/hackathons/${id}/announcements`, {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          audience: "ALL",
          pinned,
          sendEmail,
        }),
      });

      setTitle("");
      setBody("");
      setPinned(false);
      setSendEmail(false);
      setShowModal(false);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || "Failed to broadcast announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (annId: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await apiFetch(`/announcements/${annId}`, { method: "DELETE" });
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || "Failed to delete announcement");
    }
  };

  if (loading) return <LoadingState message="Loading announcements..." />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            Announcements & Broadcasts
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Publish critical notices, schedule changes, and mentorship updates directly to participants.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Broadcast</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-12 text-center border border-[var(--border)] rounded-2xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm">
            <Megaphone size={36} className="mx-auto mb-3 text-[var(--text-secondary)] opacity-40" />
            <p className="font-medium text-[var(--text-primary)]">No announcements yet</p>
            <p className="text-xs mt-1">Broadcast key updates, deadline notices, or sponsor bounties to your hackers.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm hover:border-[#F97316]/30 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone size={18} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                      {ann.title}
                    </h3>
                    {ann.pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">
                        <Pin size={10} />
                        PINNED
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans leading-relaxed whitespace-pre-wrap">
                    {ann.body}
                  </p>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono flex items-center gap-2 pt-2">
                    <Clock size={12} />
                    <span>
                      {new Date(ann.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(ann.id)}
                className="text-zinc-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors self-end sm:self-start"
                title="Delete announcement"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">
                Broadcast New Announcement
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Submissions Portal is Now Open!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your announcement details, instructions, or zoom links..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[#F97316]/60"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="rounded border-[var(--border)] text-[#F97316] focus:ring-[#F97316]"
                  />
                  <span>Pin to top of participant portal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="rounded border-[var(--border)] text-[#F97316] focus:ring-[#F97316]"
                  />
                  <span>Notify via Email</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#F97316] text-white hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? "Broadcasting..." : "Broadcast"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
