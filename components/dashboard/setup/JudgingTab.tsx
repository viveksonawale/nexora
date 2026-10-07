"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2, Scale } from "lucide-react";
import { LoadingState } from "@/components/shared/states";

export function JudgingTab({ hackathon }: { hackathon: any }) {
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCriteria = () => {
    setLoading(true);
    apiFetch(`/hackathons/${hackathon.id}`)
      .then((data: any) => setCriteria(data.criteria || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCriteria();
  }, [hackathon.id]);

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    maxScore: "10",
    weight: "1",
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      const payload: any = { ...newItem };
      payload.maxScore = parseInt(payload.maxScore, 10);
      payload.weight = parseFloat(payload.weight);

      await apiFetch(`/hackathons/${hackathon.id}/criteria`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNewItem({ name: "", description: "", maxScore: "10", weight: "1" });
      fetchCriteria();
    } catch (err: any) {
      setError(err.message || "Failed to add criterion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Remove this judging criterion?")) return;
    try {
      await apiFetch(`/hackathons/${hackathon.id}/criteria/${itemId}`, { method: "DELETE" });
      fetchCriteria();
    } catch (err: any) {
      alert("Failed to delete criterion");
    }
  };

  if (loading) return <LoadingState message="Loading criteria..." />;

  const totalMaxScore = criteria.reduce((sum, c) => sum + (c.maxScore * c.weight), 0);

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
          <Scale size={20} />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">Judging Criteria</h2>
          <p className="text-sm font-sans text-[var(--text-secondary)]">
            Define how submissions will be scored. Maximum possible score per judge: {totalMaxScore}.
          </p>
        </div>
      </div>

      {criteria.length === 0 ? (
        <div className="p-6 border border-[var(--border)] rounded-2xl text-center text-[var(--text-secondary)] font-sans">
          No judging criteria added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {criteria.map(item => (
            <div key={item.id} className="flex items-start justify-between p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-3">
                  <h4 className="font-display font-bold text-[var(--text-primary)]">{item.name}</h4>
                  <span className="text-xs font-sans bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded">
                    Score: 0 - {item.maxScore} (Weight: x{item.weight})
                  </span>
                </div>
                <div className="text-sm font-sans text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
                  {item.description}
                </div>
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

      <form onSubmit={handleAddItem} className="p-6 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl space-y-4 max-w-2xl">
        <h3 className="font-display font-bold text-[var(--text-primary)]">Add New Criterion</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-sans text-[var(--text-primary)]">Criterion Name</label>
            <input
              required
              type="text"
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
              placeholder="e.g. Innovation & Originality"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-sans text-[var(--text-primary)]">Description / Rubric</label>
            <textarea
              required
              rows={3}
              value={newItem.description}
              onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500 resize-none"
              placeholder="Explain what judges should look for..."
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Max Score (Default 10)</label>
            <input
              required
              type="number"
              min="1"
              value={newItem.maxScore}
              onChange={e => setNewItem(p => ({ ...p, maxScore: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Weight Multiplier (Default 1.0)</label>
            <input
              required
              type="number"
              step="0.1"
              min="0.1"
              value={newItem.weight}
              onChange={e => setNewItem(p => ({ ...p, weight: e.target.value }))}
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
          {saving ? "Adding..." : "Add Criterion"}
        </button>
      </form>
    </div>
  );
}
