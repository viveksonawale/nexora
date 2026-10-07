"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import { Tag, Plus, Trash2 } from "lucide-react";

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/admin/skills");
      setSkills(data as any[]);
    } catch (err: any) {
      setError(err.message || "Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    
    setIsAdding(true);
    try {
      await apiFetch("/admin/skills", {
        method: "POST",
        body: JSON.stringify({ name: newSkill.trim() }),
      });
      setNewSkill("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to add skill");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;
    try {
      await apiFetch(`/admin/skills/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete skill");
    }
  };

  if (loading) return <LoadingState message="Loading skills..." />;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Skills Catalogue</h1>
          <p className="text-[var(--text-secondary)] font-sans mt-2">
            Manage the global list of skills available for users.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 mb-8">
        <form onSubmit={handleAdd} className="flex gap-4">
          <input
            type="text"
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            placeholder="e.g. React, Python, UI/UX Design..."
            className="flex-1 px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500"
          />
          <ShinyButton variant="primary" disabled={isAdding || !newSkill.trim()} className="flex items-center gap-2">
            <Plus size={16} /> Add Skill
          </ShinyButton>
        </form>
      </div>

      <div className="bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left font-sans">
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Skill Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {skills.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                  No skills found.
                </td>
              </tr>
            ) : (
              skills.map((skill: any) => (
                <tr key={skill.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                      <Tag size={16} className="text-orange-500" />
                      {skill.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors inline-flex"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
