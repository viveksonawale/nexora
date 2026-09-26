"use client";

import { Navbar } from "../components/Navbar";
import { Users, GraduationCap, Sparkles, Code2 } from "lucide-react";

const team = [
  { name: "Vivek Sonawale", role: "Developer" },
  { name: "Akshata Bhoi", role: "Developer" },
  { name: "Sarvesh Yadav", role: "Developer" },
  { name: "Jayesh Wagh", role: "Developer" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Navbar />

      {/* ── Hero / Mission ──────────────────────────────────────── */}
      <div className="relative pt-32 pb-24 px-6 md:px-12 overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#FB923C]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center mt-12">
          {/* Eyebrow */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-md text-xs font-mono shadow-sm">
              <GraduationCap size={14} className="text-[#F97316]" />
              <span className="text-[var(--text-secondary)] font-medium uppercase tracking-wider">
                Our Story
              </span>
            </div>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8">
            Empowering Colleges to Run <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#EA580C] bg-clip-text text-transparent italic font-accent font-normal">
              Massive Hackathons
            </span>
          </h1>
          
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute -left-6 -top-6 text-6xl text-[#F97316]/20 font-serif">"</div>
            <p className="font-sans text-xl md:text-2xl text-[var(--text-secondary)] leading-relaxed font-medium relative z-10">
              We made this project specifically for colleges who need to easily handle and organize large-scale hackathons. Nexora is designed to make the entire process, from registrations to results, seamless and beautiful.
            </p>
            <div className="absolute -right-6 -bottom-8 text-6xl text-[#F97316]/20 font-serif">"</div>
          </div>
        </div>
      </div>

      {/* ── Team Section ────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pb-32">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4 flex items-center justify-center gap-3">
            <Users className="text-[#F97316]" /> Built By
          </h2>
          <div className="w-16 h-1 bg-[#F97316]/30 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {team.map((member, idx) => (
            <div
              key={idx}
              className="group relative border border-[var(--border)] bg-[var(--bg-elevated)]/40 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:border-[#F97316]/40 hover:bg-[var(--bg-elevated)]/80 hover:-translate-y-1"
            >
              {/* Avatar placeholder with initials */}
              <div className="w-20 h-20 rounded-full mb-5 bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-white font-display text-2xl font-bold shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                {member.name.split(" ").map(n => n[0]).join("")}
              </div>
              
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-1">
                {member.name}
              </h3>
              <p className="font-mono text-xs text-[#F97316] uppercase tracking-wider flex items-center gap-1.5 justify-center">
                <Code2 size={12} /> {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
