"use client";

import { use } from "react";

export default function PlaceholderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] capitalize">
        Module Under Construction
      </h1>
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-secondary)] font-sans">
        This section is coming soon.
      </div>
    </div>
  );
}
