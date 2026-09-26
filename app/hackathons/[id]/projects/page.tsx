"use client";

import { use } from "react";
import { hackathons } from "../../../data/hackathons";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";

export default function ProjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hackathon = hackathons.find((h) => h.slug === id);

  if (!hackathon) {
    notFound();
  }

  const projects = [
    { name: "PactAgent", by: "Pontmore", desc: "Agents make pacts. Protocols keep the truth." },
    { name: "Stegashareus", by: "Alok", desc: "Covert, Loss-Resistant Seed Phrase Storage" },
    { name: "Ghost Infrastructure", by: "Olivia", desc: "Turning neglected urban land into AI-powered oppor" },
    { name: "Geo echo", by: "Tiny byts", desc: "\"Don't Search Everywhere. Search Smarter.\"" },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
        Projects (48)
      </h2>
      
      <div className="flex items-center gap-3 p-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
        <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)]/70">
          <Search size={17} className="text-[var(--text-secondary)] shrink-0" />
          <input
            type="text"
            placeholder="Search for projects by name"
            className="w-full bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm font-sans outline-none min-w-0"
          />
        </div>
        <button className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] text-sm font-sans font-medium text-[var(--text-primary)]">
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p, i) => (
          <div key={i} className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[#F97316]/40 transition-colors shadow-sm flex flex-col justify-between h-48">
             <div>
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xl font-bold font-display text-indigo-400">
                   {p.name.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-sans font-bold text-lg">{p.name}</h3>
                   <div className="font-sans text-sm text-[var(--text-secondary)]">By {p.by}</div>
                 </div>
               </div>
               <p className="font-sans text-sm text-[var(--text-secondary)]">{p.desc}</p>
             </div>
             <div className="mt-4">
               <span className="font-sans text-xs border border-[var(--border)] rounded-md px-2 py-1 bg-[var(--bg-canvas)] flex items-center w-fit gap-1.5">
                 🏆 Built at {hackathon.name}
               </span>
             </div>
          </div>
        ))}
      </div>
    </section>
  );
}
