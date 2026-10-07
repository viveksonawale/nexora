"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2 } from "lucide-react";
import { LoadingState } from "@/components/shared/states";

export function ScheduleTab({ hackathon }: { hackathon: any }) {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSchedule = () => {
    setLoading(true);
    apiFetch(`/hackathons/${hackathon.id}`)
      .then((data: any) => setSchedule(data.schedule || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, [hackathon.id]);

  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      const payload: any = { ...newItem };
      payload.startsAt = new Date(payload.startsAt).toISOString();
      if (payload.endsAt) payload.endsAt = new Date(payload.endsAt).toISOString();
      else delete payload.endsAt;

      await apiFetch(`/hackathons/${hackathon.id}/schedule`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      setNewItem({ title: "", description: "", location: "", startsAt: "", endsAt: "" });
      fetchSchedule();
    } catch (err: any) {
      setError(err.message || "Failed to add schedule item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Remove this schedule item?")) return;
    try {
      await apiFetch(`/hackathons/${hackathon.id}/schedule/${itemId}`, { method: "DELETE" });
      fetchSchedule();
    } catch (err: any) {
      alert("Failed to delete item");
    }
  };

  if (loading) return <LoadingState message="Loading schedule..." />;

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      {schedule.length === 0 ? (
        <div className="p-6 border border-[var(--border)] rounded-2xl text-center text-[var(--text-secondary)] font-sans">
          No schedule items added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl">
              <div>
                <h4 className="font-display font-bold text-[var(--text-primary)]">{item.title}</h4>
                <div className="text-sm font-sans text-[var(--text-secondary)] mt-1">
                  {new Date(item.startsAt).toLocaleString()} {item.endsAt && `- ${new Date(item.endsAt).toLocaleString()}`}
                </div>
                {item.location && (
                  <div className="text-xs font-sans text-[var(--text-secondary)] mt-1">
                    📍 {item.location}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAddItem} className="p-6 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl space-y-4">
        <h3 className="font-display font-bold text-[var(--text-primary)]">Add Schedule Item</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Title</label>
            <input
              required
              type="text"
              value={newItem.title}
              onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Location</label>
            <input
              type="text"
              value={newItem.location}
              onChange={e => setNewItem(p => ({ ...p, location: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-sans text-[var(--text-primary)]">Description</label>
          <input
            type="text"
            value={newItem.description}
            onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Starts At</label>
            <input
              required
              type="datetime-local"
              value={newItem.startsAt}
              onChange={e => setNewItem(p => ({ ...p, startsAt: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Ends At (Optional)</label>
            <input
              type="datetime-local"
              value={newItem.endsAt}
              onChange={e => setNewItem(p => ({ ...p, endsAt: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-lg font-sans font-medium transition-colors"
        >
          <Plus size={16} />
          {saving ? "Adding..." : "Add to Schedule"}
        </button>
      </form>
    </div>
  );
}
