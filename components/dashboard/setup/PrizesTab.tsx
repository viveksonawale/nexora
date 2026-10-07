"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2, Trophy, Tag } from "lucide-react";
import { LoadingState } from "@/components/shared/states";

export function PrizesTab({ hackathon }: { hackathon: any }) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/hackathons/${hackathon.id}`) as any;
      setTracks(data.tracks || []);
      setPrizes(data.prizes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hackathon.id]);

  // Track Form
  const [newTrack, setNewTrack] = useState({ name: "", description: "" });
  const [savingTrack, setSavingTrack] = useState(false);

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTrack(true);
    try {
      await apiFetch(`/hackathons/${hackathon.id}/tracks`, {
        method: "POST",
        body: JSON.stringify(newTrack),
      });
      setNewTrack({ name: "", description: "" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingTrack(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Delete this track?")) return;
    try {
      await apiFetch(`/hackathons/${hackathon.id}/tracks/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // Prize Form
  const [newPrize, setNewPrize] = useState({ title: "", description: "", amount: "", currency: "INR", trackId: "" });
  const [savingPrize, setSavingPrize] = useState(false);

  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrize(true);
    try {
      const payload: any = { ...newPrize };
      if (payload.amount) payload.amount = parseFloat(payload.amount);
      else delete payload.amount;
      if (!payload.trackId) payload.trackId = null;

      await apiFetch(`/hackathons/${hackathon.id}/prizes`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNewPrize({ title: "", description: "", amount: "", currency: "INR", trackId: "" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPrize(false);
    }
  };

  const handleDeletePrize = async (id: string) => {
    if (!confirm("Delete this prize?")) return;
    try {
      await apiFetch(`/hackathons/${hackathon.id}/prizes/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  if (loading) return <LoadingState message="Loading prizes..." />;

  return (
    <div className="space-y-12">
      {/* Tracks Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Tag size={20} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">Tracks (Optional)</h2>
            <p className="text-sm font-sans text-[var(--text-secondary)]">Create tracks or categories for submissions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map(track => (
            <div key={track.id} className="p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl flex items-start justify-between">
              <div>
                <div className="font-sans font-bold text-[var(--text-primary)]">{track.name}</div>
                <div className="text-sm font-sans text-[var(--text-secondary)] mt-1">{track.description}</div>
              </div>
              <button onClick={() => handleDeleteTrack(track.id)} className="text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddTrack} className="p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)]">Track Name</label>
              <input
                required
                type="text"
                value={newTrack.name}
                onChange={e => setNewTrack(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)]">Description</label>
              <input
                type="text"
                value={newTrack.description}
                onChange={e => setNewTrack(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <button type="submit" disabled={savingTrack} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-lg font-sans font-medium transition-colors">
            <Plus size={16} /> {savingTrack ? "Adding..." : "Add Track"}
          </button>
        </form>
      </section>

      {/* Prizes Section */}
      <section className="space-y-6 pt-6 border-t border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Trophy size={20} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">Prizes</h2>
            <p className="text-sm font-sans text-[var(--text-secondary)]">Add overall and track-specific prizes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prizes.map(prize => (
            <div key={prize.id} className="p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl flex items-start justify-between">
              <div>
                <div className="font-sans font-bold text-[var(--text-primary)]">{prize.title}</div>
                <div className="text-sm font-sans text-[var(--text-secondary)] mt-1">{prize.description}</div>
                <div className="mt-2 text-sm font-sans font-medium text-orange-500">
                  {prize.amount ? `${prize.amount} ${prize.currency}` : "Non-cash prize"}
                </div>
                {prize.track && (
                  <div className="mt-1 text-xs font-sans text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-1 rounded inline-block">
                    Track: {prize.track.name}
                  </div>
                )}
              </div>
              <button onClick={() => handleDeletePrize(prize.id)} className="text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddPrize} className="p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)]">Prize Title</label>
              <input
                required
                type="text"
                value={newPrize.title}
                onChange={e => setNewPrize(p => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
                placeholder="e.g. 1st Place Overall"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)]">Description</label>
              <input
                type="text"
                value={newPrize.description}
                onChange={e => setNewPrize(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)]">Cash Amount (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newPrize.amount}
                  onChange={e => setNewPrize(p => ({ ...p, amount: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
                  placeholder="e.g. 5000"
                />
                <select
                  value={newPrize.currency}
                  onChange={e => setNewPrize(p => ({ ...p, currency: e.target.value }))}
                  className="w-24 px-2 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans text-[var(--text-primary)]">Assign to Track</label>
              <select
                value={newPrize.trackId}
                onChange={e => setNewPrize(p => ({ ...p, trackId: e.target.value }))}
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="">Overall (No specific track)</option>
                {tracks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={savingPrize} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-lg font-sans font-medium transition-colors">
            <Plus size={16} /> {savingPrize ? "Adding..." : "Add Prize"}
          </button>
        </form>
      </section>
    </div>
  );
}
