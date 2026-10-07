"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2 } from "lucide-react";
import { LoadingState } from "@/components/shared/states";

export function FaqsTab({ hackathon }: { hackathon: any }) {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchFaqs = () => {
    setLoading(true);
    apiFetch(`/hackathons/${hackathon.id}`)
      .then((data: any) => setFaqs(data.faqs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFaqs();
  }, [hackathon.id]);

  const [newItem, setNewItem] = useState({
    question: "",
    answer: "",
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      await apiFetch(`/hackathons/${hackathon.id}/faqs`, {
        method: "POST",
        body: JSON.stringify(newItem),
      });
      setNewItem({ question: "", answer: "" });
      fetchFaqs();
    } catch (err: any) {
      setError(err.message || "Failed to add FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Remove this FAQ?")) return;
    try {
      await apiFetch(`/hackathons/${hackathon.id}/faqs/${itemId}`, { method: "DELETE" });
      fetchFaqs();
    } catch (err: any) {
      alert("Failed to delete FAQ");
    }
  };

  if (loading) return <LoadingState message="Loading FAQs..." />;

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      {faqs.length === 0 ? (
        <div className="p-6 border border-[var(--border)] rounded-2xl text-center text-[var(--text-secondary)] font-sans">
          No FAQs added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map(item => (
            <div key={item.id} className="flex items-start justify-between p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl">
              <div className="flex-1 mr-4">
                <h4 className="font-display font-bold text-[var(--text-primary)]">Q: {item.question}</h4>
                <div className="text-sm font-sans text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
                  {item.answer}
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
        <h3 className="font-display font-bold text-[var(--text-primary)]">Add New FAQ</h3>
        
        <div className="space-y-1.5">
          <label className="text-sm font-sans text-[var(--text-primary)]">Question</label>
          <input
            required
            type="text"
            value={newItem.question}
            onChange={e => setNewItem(p => ({ ...p, question: e.target.value }))}
            className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
            placeholder="e.g. Can I participate remotely?"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-sans text-[var(--text-primary)]">Answer</label>
          <textarea
            required
            rows={4}
            value={newItem.answer}
            onChange={e => setNewItem(p => ({ ...p, answer: e.target.value }))}
            className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500 resize-none"
            placeholder="Provide a helpful answer..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-lg font-sans font-medium transition-colors"
        >
          <Plus size={16} />
          {saving ? "Adding..." : "Add FAQ"}
        </button>
      </form>
    </div>
  );
}
