"use client";

import { use } from "react";
import { hackathons } from "../../../data/hackathons";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";

export default function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hackathon = hackathons.find((h) => h.slug === id);

  if (!hackathon) {
    notFound();
  }

  return (
    <>
      <section className="space-y-6">
        <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
          It&apos;s time to inspire and innovate!
        </h2>
        <div className="text-[var(--text-secondary)] text-lg leading-relaxed space-y-5">
          <p>
            <strong className="text-[var(--text-primary)] font-semibold">{hackathon.name}</strong> - The Flagship Hackathon at {hackathon.college} is here to challenge the brightest minds.
            Join us for an electrifying <span className="lowercase">{hackathon.mode}</span> experience where creativity meets technology.
          </p>
          <p>
            Whether you&apos;re a seasoned developer or a passionate beginner, this is your platform to build solutions that matter,
            connect with industry experts, and showcase your skills on a global stage. The hackathon will focus on pushing boundaries in {hackathon.tags.join(" and ")}.
          </p>
        </div>
      </section>

      <section className="space-y-6">
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
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {[
               { title: "First Prize", amount: "$2,000", color: "from-yellow-400/10 to-yellow-600/10", border: "border-yellow-500/20 text-yellow-500" },
               { title: "Second Prize", amount: "$1,000", color: "from-gray-300/10 to-gray-500/10", border: "border-gray-400/20 text-gray-400" },
               { title: "Third Prize", amount: "$500", color: "from-amber-600/10 to-amber-800/10", border: "border-amber-700/20 text-amber-600" },
               { title: "Best All-Girls Team", amount: "$250", color: "from-pink-500/10 to-rose-600/10", border: "border-pink-500/20 text-pink-500" },
             ].map((prize, i) => (
               <div key={i} className={`p-5 rounded-2xl border ${prize.border} bg-gradient-to-br ${prize.color} flex items-center justify-between`}>
                 <span className="font-bold font-sans">{prize.title}</span>
                 <span className="font-sans font-bold text-xl">{prize.amount}</span>
               </div>
             ))}
           </div>
         </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
          Guidelines & Rules
        </h2>
        <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-3 marker:text-[#F97316] font-sans">
          <li>Teams can consist of 1 to 4 members.</li>
          <li>All code must be written during the hackathon period.</li>
          <li>Use of open-source libraries and APIs is allowed and encouraged.</li>
          <li>Submissions must include a GitHub repository and a short video demo.</li>
        </ul>
      </section>
    </>
  );
}
