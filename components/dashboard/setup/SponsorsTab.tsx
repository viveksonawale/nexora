"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2, HeartHandshake } from "lucide-react";
import { LoadingState } from "@/components/shared/states";

export function SponsorsTab({ hackathon }: { hackathon: any }) {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSponsors = () => {
    setLoading(true);
    apiFetch(`/hackathons/${hackathon.id}`)
      .then((data: any) => setSponsors(data.sponsors || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSponsors();
  }, [hackathon.id]);

  const [newItem, setNewItem] = useState({
    name: "",
    tier: "PARTNER",
    logoUrl: "",
    websiteUrl: "",
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      const payload: any = { ...newItem };
      if (!payload.logoUrl) delete payload.logoUrl;
      if (!payload.websiteUrl) delete payload.websiteUrl;

      await apiFetch(`/hackathons/${hackathon.id}/sponsors`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNewItem({ name: "", tier: "PARTNER", logoUrl: "", websiteUrl: "" });
      fetchSponsors();
    } catch (err: any) {
      setError(err.message || "Failed to add sponsor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Remove this sponsor?")) return;
    try {
      await apiFetch(`/hackathons/${hackathon.id}/sponsors/${itemId}`, { method: "DELETE" });
      fetchSponsors();
    } catch (err: any) {
      alert("Failed to delete sponsor");
    }
  };

  if (loading) return <LoadingState message="Loading sponsors..." />;

  const groupedSponsors = sponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) acc[sponsor.tier] = [];
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<string, any[]>);

  const tierOrder = ["TITLE", "PLATINUM", "GOLD", "SILVER", "BRONZE", "PARTNER"];

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-sans">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
          <HeartHandshake size={20} />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">Sponsors</h2>
          <p className="text-sm font-sans text-[var(--text-secondary)]">
            Manage your hackathon's sponsors and partners.
          </p>
        </div>
      </div>

      {sponsors.length === 0 ? (
        <div className="p-6 border border-[var(--border)] rounded-2xl text-center text-[var(--text-secondary)] font-sans">
          No sponsors added yet.
        </div>
      ) : (
        <div className="space-y-8">
          {tierOrder.map(tier => {
            const tierSponsors = groupedSponsors[tier];
            if (!tierSponsors || tierSponsors.length === 0) return null;
            return (
              <div key={tier} className="space-y-4">
                <h3 className="text-sm font-display font-bold text-[var(--text-secondary)] uppercase tracking-wider">{tier} SPONSORS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tierSponsors.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl">
                      <div className="flex items-center gap-4">
                        {item.logoUrl ? (
                          <img src={item.logoUrl} alt={item.name} className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-[var(--border)]" />
                        ) : (
                          <div className="w-12 h-12 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg flex items-center justify-center font-display font-bold text-[var(--text-secondary)]">
                            {item.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-display font-bold text-[var(--text-primary)]">{item.name}</h4>
                          {item.websiteUrl && (
                            <a href={item.websiteUrl} target="_blank" rel="noreferrer" className="text-xs font-sans text-orange-500 hover:underline">
                              {item.websiteUrl}
                            </a>
                          )}
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
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleAddItem} className="p-6 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl space-y-4 max-w-2xl">
        <h3 className="font-display font-bold text-[var(--text-primary)]">Add Sponsor</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Sponsor Name</label>
            <input
              required
              type="text"
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Tier</label>
            <select
              value={newItem.tier}
              onChange={e => setNewItem(p => ({ ...p, tier: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="TITLE">Title Sponsor</option>
              <option value="PLATINUM">Platinum</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="BRONZE">Bronze</option>
              <option value="PARTNER">Partner</option>
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Logo URL (Optional)</label>
            <input
              type="url"
              value={newItem.logoUrl}
              onChange={e => setNewItem(p => ({ ...p, logoUrl: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans text-[var(--text-primary)]">Website URL (Optional)</label>
            <input
              type="url"
              value={newItem.websiteUrl}
              onChange={e => setNewItem(p => ({ ...p, websiteUrl: e.target.value }))}
              className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg font-sans text-sm focus:outline-none focus:border-orange-500"
              placeholder="https://..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-orange-500 text-[var(--text-primary)] rounded-lg font-sans font-medium transition-colors"
        >
          <Plus size={16} />
          {saving ? "Adding..." : "Add Sponsor"}
        </button>
      </form>
    </div>
  );
}
