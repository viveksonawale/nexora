"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export function GeneralTab({ hackathon }: { hackathon: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: hackathon.title || "",
    tagline: hackathon.tagline || "",
    description: hackathon.description || "",
    mode: hackathon.mode || "OFFLINE",
    venueName: hackathon.venueName || "",
    venueAddress: hackathon.venueAddress || "",
    city: hackathon.city || "",
    country: hackathon.country || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await apiFetch(`/hackathons/${hackathon.id}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      router.refresh();
      // Optional: show a success toast here
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
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

      <div className="space-y-1.5">
        <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
          Hackathon Title
        </label>
        <input
          required
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
          className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
          Tagline (Short phrase)
        </label>
        <input
          type="text"
          value={formData.tagline}
          onChange={(e) => setFormData(p => ({ ...p, tagline: e.target.value }))}
          className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
          Description
        </label>
        <textarea
          rows={5}
          value={formData.description}
          onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
          className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
          Event Mode
        </label>
        <select
          value={formData.mode}
          onChange={(e) => setFormData(p => ({ ...p, mode: e.target.value }))}
          className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
        >
          <option value="OFFLINE">In-Person (Offline)</option>
          <option value="ONLINE">Online</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>

      {formData.mode !== "ONLINE" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
                Venue Name
              </label>
              <input
                type="text"
                value={formData.venueName}
                onChange={(e) => setFormData(p => ({ ...p, venueName: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
              Full Venue Address
            </label>
            <input
              type="text"
              value={formData.venueAddress}
              onChange={(e) => setFormData(p => ({ ...p, venueAddress: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </>
      )}

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
