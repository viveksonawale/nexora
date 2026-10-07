"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState, ErrorState } from "@/components/shared/states";
import { Search } from "lucide-react";

export default function ProjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/hackathons/${id}/projects`)
      .then((data) => setProjects(data as any[]))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading projects..." />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 text-2xl">
        🔒
      </div>
      <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">
        Projects are not public yet
      </h3>
      <p className="text-sm text-[var(--text-secondary)] font-sans">
        {error}
      </p>
    </div>
  );

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] tracking-tight">
        Projects ({projects.length})
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
                   {p.title.charAt(0)}
                 </div>
                 <div>
                   <h3 className="font-sans font-bold text-lg">{p.title}</h3>
                   <div className="font-sans text-sm text-[var(--text-secondary)]">By {p.teamName}</div>
                 </div>
               </div>
               <p className="font-sans text-sm text-[var(--text-secondary)] line-clamp-3">{p.description}</p>
             </div>
             <div className="mt-4">
               <span className="font-sans text-xs border border-[var(--border)] rounded-md px-2 py-1 bg-[var(--bg-canvas)] flex items-center w-fit gap-1.5">
                 🏆 Submitted
               </span>
             </div>
          </div>
        ))}
      </div>
    </section>
  );
}
