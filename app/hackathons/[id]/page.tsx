"use client";

import { notFound } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { hackathons } from "../../data/hackathons";
import { use } from "react";
import { Clock, MapPin, Link2, Share, Trophy } from "lucide-react";

export default function HackathonOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hackathon = hackathons.find((h) => h.slug === id);

  if (!hackathon) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] selection:bg-[#F97316]/30 font-sans">
      <Navbar />

      {/* ── Header Banner ── */}
      <div className="relative w-full h-64 md:h-80 bg-gradient-to-r from-orange-950 via-[#F97316]/80 to-orange-500">
        <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />
        {/* Abstract pattern / noise overlay */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center z-10">
             <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center mb-6 shadow-2xl">
               <span className="text-5xl font-display font-bold text-white drop-shadow-md">
                 {hackathon.name.charAt(0)}
               </span>
             </div>
             <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white tracking-tight drop-shadow-lg text-center px-4">
               {hackathon.name}
             </h1>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation ── */}
      <div className="sticky top-0 z-30 bg-[var(--bg-elevated)]/90 backdrop-blur-xl border-b border-[var(--border)] w-full">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            {["OVERVIEW", "PRIZES", "SCHEDULE", "LEADERBOARD"].map((tab, i) => (
              <button
                key={tab}
                className={`py-5 text-xs font-mono font-bold tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                  i === 0
                    ? "border-[#F97316] text-[#F97316]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        
        {/* Left Column (Content) */}
        <div className="flex-1 space-y-12">
          
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
                     <span className="font-bold">{prize.title}</span>
                     <span className="font-mono font-bold text-xl">{prize.amount}</span>
                   </div>
                 ))}
               </div>
             </div>
          </section>

          {/* Guidelines / Rules placeholder */}
          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] tracking-tight">
              Guidelines & Rules
            </h2>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-3 marker:text-[#F97316]">
              <li>Teams can consist of 1 to 4 members.</li>
              <li>All code must be written during the hackathon period.</li>
              <li>Use of open-source libraries and APIs is allowed and encouraged.</li>
              <li>Submissions must include a GitHub repository and a short video demo.</li>
            </ul>
          </section>
        </div>

        {/* Right Sidebar (Sticky Box) */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-32 space-y-6">
            
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
                  <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                    RUNS FROM
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold">
                    <Clock size={18} className="text-[#F97316]" />
                    {hackathon.startDate}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                    HAPPENING
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold">
                    <MapPin size={18} className="text-[#F97316]" />
                    {hackathon.location}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                    APPLICATIONS CLOSE IN
                  </div>
                  <div className="text-2xl font-mono font-bold text-[#F97316]">
                    12d 14h 30m
                  </div>
                </div>

              </div>

              {/* Apply Button */}
              <div className="mt-8 pt-6 border-t border-[var(--border)]">
                <button className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Apply now
                </button>
                <div className="mt-6 flex items-center justify-center -space-x-2">
                  {hackathon.avatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border-[3px] border-[var(--bg-elevated)] object-cover"
                    />
                  ))}
                </div>
                <div className="mt-2 text-center text-xs font-semibold text-[var(--text-secondary)]">
                  Join <span className="text-[#F97316]">{hackathon.participants}+</span> participants
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
