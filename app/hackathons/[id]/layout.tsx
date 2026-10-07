"use client";

import { notFound, usePathname } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { hackathons } from "../../data/hackathons";
import { use, useEffect, useState } from "react";
import { Clock, MapPin, Link2, Share, Trophy } from "lucide-react";
import Link from "next/link";
import { NorButton } from "../../../components/ui/nor-button";

import { apiFetch } from "@/lib/api-client";
import { LoadingState, ErrorState } from "@/components/shared/states";

export default function HackathonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch(`/hackathons/${id}`);
        setHackathon(data);
      } catch (err: any) {
        setError(err.message || "Failed to load hackathon");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <LoadingState message="Loading hackathon details..." />;
  if (error || !hackathon) return <ErrorState message={error || "Not found"} onRetry={() => window.location.reload()} />;

  const tabs = [
    { name: "OVERVIEW", href: `/hackathons/${id}/overview` },
    { name: "PRIZES", href: `/hackathons/${id}/prizes` },
    { name: "SCHEDULE", href: `/hackathons/${id}/schedule` },
    { name: "PROJECTS", href: `/hackathons/${id}/projects` },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] selection:bg-[#F97316]/30 font-sans">
      {/* ── Header Banner ── */}
      <div className="relative w-full h-64 md:h-80 bg-gradient-to-r from-orange-950 via-[#F97316]/80 to-orange-500">
        <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center z-10">
             <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center mb-6 shadow-2xl">
               <span className="text-5xl font-display font-bold text-white drop-shadow-md">
                 {hackathon.title.charAt(0)}
               </span>
             </div>
             <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white tracking-tight drop-shadow-lg text-center px-4">
               {hackathon.title}
             </h1>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation (Devfolio-style Centered Floating Navbar) ── */}
      <div className="sticky top-4 z-40 w-full flex justify-center px-4 py-2 pointer-events-none">
        <nav className="pointer-events-auto inline-flex items-center p-1.5 rounded-2xl bg-[var(--bg-elevated)]/95 backdrop-blur-xl border border-[var(--border)] shadow-lg shadow-black/5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || (pathname === `/hackathons/${id}` && tab.name === "OVERVIEW");
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`px-6 py-2.5 rounded-xl text-xs font-sans font-extrabold tracking-wider uppercase transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-[#F97316] text-white shadow-md shadow-orange-500/25"
                      : "text-[#F97316] hover:bg-[#F97316]/10"
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Left Column (Content) */}
        <div className="flex-1 space-y-12">
          {children}
        </div>

        {/* Right Sidebar (Sticky Box) */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-24 space-y-6">
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <button className="flex-1 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[#F97316]/40 flex items-center justify-center gap-2 font-semibold text-[var(--text-secondary)] hover:text-[#F97316] transition-colors shadow-sm">
                <Link2 size={18} /> Website
              </button>
              <button className="flex-1 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[#F97316]/40 flex items-center justify-center gap-2 font-semibold text-[var(--text-secondary)] hover:text-[#F97316] transition-colors shadow-sm">
                <Share size={18} /> Share
              </button>
            </div>

            {/* Status Card */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 backdrop-blur-md p-6 shadow-xl shadow-black/5">
              <div className="space-y-6">
                
                <div>
                  <div className="text-[10px] font-sans font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                    RUNS FROM
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold font-sans">
                    <Clock size={18} className="text-[#F97316]" />
                    {new Date(hackathon.startsAt).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-sans font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                    HAPPENING
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold font-sans">
                    <MapPin size={18} className="text-[#F97316]" />
                    {hackathon.city || hackathon.mode}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-sans font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                    APPLICATIONS CLOSE IN
                  </div>
                  <div className="text-2xl font-sans font-bold text-[#F97316]">
                    12d 14h 30m
                  </div>
                </div>

              </div>

              {/* Apply Button */}
              <div className="mt-8 pt-6 border-t border-[var(--border)]">
                <Link href={`/hackathons/${id}/register`} className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center justify-center">
                  Apply now
                </Link>
                <div className="mt-2 text-center text-xs font-semibold text-[var(--text-secondary)] font-sans">
                  Join <span className="text-[#F97316]">{hackathon.seatsLeft !== null ? `${hackathon.seatsLeft} seats left` : 'Unlimited seats'}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
