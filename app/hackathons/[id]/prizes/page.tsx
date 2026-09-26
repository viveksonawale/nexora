"use client";

import { use } from "react";
import { hackathons } from "../../../data/hackathons";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";

export default function PrizesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hackathon = hackathons.find((h) => h.slug === id);

  if (!hackathon) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
        Prizes
      </h2>
      <div className="p-8 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[#F97316]/40 transition-colors shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#F97316]/10 rounded-2xl text-[#F97316]">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold">{hackathon.prize} Available in Prizes</h3>
            <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">across various tracks and categories</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { title: "First Prize", amount: "$2,000", description: "Best overall project", color: "from-yellow-400/10 to-yellow-600/10", border: "border-yellow-500/20 text-yellow-500" },
            { title: "Second Prize", amount: "$1,000", description: "Second best overall project", color: "from-gray-300/10 to-gray-500/10", border: "border-gray-400/20 text-gray-400" },
            { title: "Third Prize", amount: "$500", description: "Third best overall project", color: "from-amber-600/10 to-amber-800/10", border: "border-amber-700/20 text-amber-600" },
            { title: "Best All-Girls Team", amount: "$250", description: "Top project by an all-girls team", color: "from-pink-500/10 to-rose-600/10", border: "border-pink-500/20 text-pink-500" },
          ].map((prize, i) => (
            <div key={i} className={`p-6 rounded-2xl border ${prize.border} bg-gradient-to-br ${prize.color} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div>
                <span className="font-bold font-sans text-lg block">{prize.title}</span>
                <span className="text-sm font-sans mt-1 opacity-80">{prize.description}</span>
              </div>
              <span className="font-sans font-bold text-2xl">{prize.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
