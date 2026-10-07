"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export function RegistrationTab({ hackathon }: { hackathon: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    registrationOpensAt: formatDate(hackathon.registrationOpensAt),
    registrationClosesAt: formatDate(hackathon.registrationClosesAt),
    minTeamSize: hackathon.minTeamSize || 1,
    maxTeamSize: hackathon.maxTeamSize || 4,
    maxParticipants: hackathon.maxParticipants || "",
    requireApproval: hackathon.requireApproval || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload: any = { ...formData };
      if (payload.registrationOpensAt) payload.registrationOpensAt = new Date(payload.registrationOpensAt).toISOString();
      if (payload.registrationClosesAt) payload.registrationClosesAt = new Date(payload.registrationClosesAt).toISOString();
      if (payload.maxParticipants === "") payload.maxParticipants = null;
      else payload.maxParticipants = parseInt(payload.maxParticipants, 10);
      
      payload.minTeamSize = parseInt(payload.minTeamSize, 10);
      payload.maxTeamSize = parseInt(payload.maxTeamSize, 10);

      await apiFetch(`/hackathons/${hackathon.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save registration settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Registration Opens At
          </label>
          <input
            type="datetime-local"
            value={formData.registrationOpensAt}
            onChange={(e) => setFormData(p => ({ ...p, registrationOpensAt: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Registration Closes At
          </label>
          <input
            type="datetime-local"
            value={formData.registrationClosesAt}
            onChange={(e) => setFormData(p => ({ ...p, registrationClosesAt: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Min Team Size
          </label>
          <input
            required
            type="number"
            min="1"
            value={formData.minTeamSize}
            onChange={(e) => setFormData(p => ({ ...p, minTeamSize: e.target.value as any }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Max Team Size
          </label>
          <input
            required
            type="number"
            min="1"
            value={formData.maxTeamSize}
            onChange={(e) => setFormData(p => ({ ...p, maxTeamSize: e.target.value as any }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
          Total Participant Cap (Optional)
        </label>
        <input
          type="number"
          min="1"
          value={formData.maxParticipants}
          onChange={(e) => setFormData(p => ({ ...p, maxParticipants: e.target.value }))}
          className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
          placeholder="Leave empty for unlimited"
        />
      </div>

      <label className="flex items-center gap-3 p-4 border border-[var(--border)] rounded-xl bg-[var(--bg-canvas)] cursor-pointer hover:border-orange-500/50 transition-colors">
        <input
          type="checkbox"
          checked={formData.requireApproval}
          onChange={(e) => setFormData(p => ({ ...p, requireApproval: e.target.checked }))}
          className="w-5 h-5 accent-orange-500 rounded"
        />
        <div>
          <div className="text-sm font-sans font-medium text-[var(--text-primary)]">Require manual approval</div>
          <div className="text-xs font-sans text-[var(--text-secondary)]">If checked, organizers must manually approve registrations before they can participate.</div>
        </div>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-sans font-semibold transition-colors"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
