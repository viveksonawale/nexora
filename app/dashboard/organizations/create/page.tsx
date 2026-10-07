"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    type: "COMPANY",
    city: "",
    country: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch("/organizations", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 py-12">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center">
          <Building2 size={28} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">
            Create Organization
          </h1>
          <p className="text-[var(--text-secondary)] font-sans mt-1">
            Set up a workspace for your team to host hackathons.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border)]">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-sans">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Organization Name
          </label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Organization Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="COMPANY">Company</option>
            <option value="UNIVERSITY">University</option>
            <option value="NONPROFIT">Non-Profit</option>
            <option value="COMMUNITY">Community / Club</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="San Francisco"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData(p => ({ ...p, country: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="USA"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-sans font-medium text-[var(--text-primary)]">
            Description
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl font-sans text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
            placeholder="Tell us about your organization..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-sans font-semibold transition-colors"
        >
          {loading ? "Creating..." : "Create Organization"}
        </button>
      </form>
    </div>
  );
}
