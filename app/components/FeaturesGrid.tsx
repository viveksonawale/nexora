"use client";

import { ArrowRight, EyeOff, Lock, Sparkles, QrCode, CheckCircle2, Users, FileText, CalendarDays, BrainCircuit } from "lucide-react";
import Image from "next/image";

export function FeaturesGrid() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 py-24 relative z-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-md text-xs font-mono mb-6 shadow-sm">
          <span className="text-[#F97316] font-semibold tracking-wider uppercase">Powerful Features</span>
        </div>

        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight mb-6">
          Everything You Need to Run an{" "}
          <span className="bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#EA580C] bg-clip-text text-transparent italic font-accent font-normal">
            Amazing Hackathon
          </span>
        </h2>
        <p className="font-sans text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
          From registrations to results, our platform handles the entire hackathon journey with smart tools and a beautiful experience.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Blind Judging */}
        <div className="group border border-[var(--border)] bg-[var(--bg-elevated)]/40 backdrop-blur-md rounded-3xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#F97316]/10 transition-colors duration-500"></div>
          
          <div className="mb-12 relative z-10">
            <span className="font-mono text-xl font-bold text-[#F97316] mb-4 block">01</span>
            <h3 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-4">
              Blind <span className="text-[#F97316]">Judging</span>
            </h3>
            <p className="font-sans text-[var(--text-secondary)] text-lg mb-6 leading-relaxed max-w-sm">
              Ensure a fair and unbiased evaluation process. Judges review submissions without knowing participant details.
            </p>
            <a href="#" className="inline-flex items-center gap-2 text-[#F97316] font-semibold hover:gap-3 transition-all">
              Learn more <ArrowRight size={18} />
            </a>
          </div>

          {/* Mock UI */}
          <div className="relative w-full h-[220px] bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl p-5 shadow-2xl z-10 flex flex-col gap-3 transform group-hover:-translate-y-2 transition-transform duration-500">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-[var(--text-primary)]">Submissions</span>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-[#F97316] text-white text-[10px] rounded font-bold uppercase tracking-wide flex items-center gap-1"><EyeOff size={12}/> Blind Mode</span>
              </div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-[var(--border)] rounded-lg bg-[var(--bg-elevated)]/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded bg-gradient-to-br ${i===1?'from-purple-500/20 to-indigo-500/20 text-indigo-400':i===2?'from-emerald-500/20 to-teal-500/20 text-emerald-400':'from-orange-500/20 to-amber-500/20 text-orange-400'} flex items-center justify-center`}>
                    <FileText size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      Project #{i===1?'A17':i===2?'B04':'C29'}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{i===1?'Web App':i===2?'AI/ML':'Blockchain'}</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-[#F97316] border border-[#F97316]/30 px-3 py-1 rounded bg-[#F97316]/5">Review</div>
              </div>
            ))}
            {/* Floating Lock Badge */}
            <div className="absolute -bottom-4 -right-4 bg-[var(--bg-canvas)] border border-[var(--border)] p-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce" style={{animationDuration: '3s'}}>
              <div className="w-8 h-8 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center"><Lock size={14}/></div>
              <div className="text-xs text-[var(--text-secondary)] font-medium leading-tight">Participant details<br/><span className="text-[var(--text-primary)]">are hidden from judges</span></div>
            </div>
          </div>
        </div>

        {/* 2. Seamless Management */}
        <div className="group border border-[var(--border)] bg-[var(--bg-elevated)]/40 backdrop-blur-md rounded-3xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60">
          <div className="mb-12 relative z-10">
            <span className="font-mono text-xl font-bold text-[#F97316] mb-4 block">02</span>
            <h3 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-4">
              Seamless Hackathon <span className="text-[#F97316]">Management</span>
            </h3>
            <p className="font-sans text-[var(--text-secondary)] text-lg mb-6 leading-relaxed max-w-sm">
              Handle registrations, team formation, scheduling, and announcements, all in one place. Built for colleges and large scale events.
            </p>
            <a href="#" className="inline-flex items-center gap-2 text-[#F97316] font-semibold hover:gap-3 transition-all">
              Learn more <ArrowRight size={18} />
            </a>
          </div>

          {/* Mock UI */}
          <div className="relative w-full h-[220px] bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden transform group-hover:-translate-y-2 transition-transform duration-500">
            {/* Sidebar & Header */}
            <div className="flex h-full">
              <div className="w-12 border-r border-[var(--border)] bg-[var(--bg-elevated)]/30 flex flex-col items-center py-4 gap-4">
                <div className="w-6 h-6 flex items-center justify-center mb-2">
                  <Image src="/logo/logo.png" alt="Nexora Logo" width={24} height={24} className="object-contain" />
                </div>
                <Users size={16} className="text-[var(--text-primary)]" />
                <CalendarDays size={16} className="text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold text-[var(--text-primary)] text-sm">Hackathon 2026</span>
                  <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"/> Live</span>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-[var(--bg-elevated)]/50 p-2 rounded-lg border border-[var(--border)]">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Registrations</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">523</div>
                  </div>
                  <div className="bg-[var(--bg-elevated)]/50 p-2 rounded-lg border border-[var(--border)]">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Teams</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">128</div>
                  </div>
                  <div className="bg-[var(--bg-elevated)]/50 p-2 rounded-lg border border-[var(--border)]">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Submissions</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">76</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Event Timeline</div>
                <div className="relative pl-3 border-l-2 border-[#F97316]/30 flex flex-col gap-3">
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[var(--bg-canvas)]"></div>
                    <div className="text-[10px] text-[var(--text-primary)] font-semibold">Registrations Completed</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-[#F97316] border-2 border-[var(--bg-canvas)]"></div>
                    <div className="text-[10px] text-[var(--text-primary)] font-semibold">Team Formation <span className="text-[#F97316] ml-1">Live</span></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Orange Gradient Overlay Card */}
            <div className="absolute right-4 bottom-4 w-48 h-20 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl p-3 shadow-lg shadow-orange-500/20 flex flex-col justify-between border border-orange-400/50">
              <span className="text-white font-semibold text-xs leading-tight">Create an Unforgettable Hackathon Experience</span>
              <div className="self-end w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><ArrowRight size={12}/></div>
            </div>
          </div>
        </div>

        {/* 3. AI Problem Statement Summary */}
        <div className="group border border-[var(--border)] bg-[var(--bg-elevated)]/40 backdrop-blur-md rounded-3xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60">
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#F97316]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:bg-[#F97316]/10 transition-colors duration-500"></div>
          
          <div className="mb-12 relative z-10">
            <span className="font-mono text-xl font-bold text-[#F97316] mb-4 block">03</span>
            <h3 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-4">
              AI Problem <br/> Statement <span className="text-[#F97316]">Summary</span>
            </h3>
            <p className="font-sans text-[var(--text-secondary)] text-lg mb-6 leading-relaxed max-w-sm">
              Let AI generate concise and clear summaries of problem statements so participants can quickly understand and get started.
            </p>
            <a href="#" className="inline-flex items-center gap-2 text-[#F97316] font-semibold hover:gap-3 transition-all">
              Learn more <ArrowRight size={18} />
            </a>
          </div>

          {/* Mock UI */}
          <div className="relative w-full h-[220px] z-10">
            {/* Background Doc */}
            <div className="absolute top-0 right-10 w-64 h-32 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl p-4 shadow-md rotate-3 transition-transform duration-500 group-hover:rotate-6">
              <div className="text-xs font-bold text-[var(--text-primary)] mb-3">Original Problem Statement</div>
              <div className="w-full h-1.5 bg-[var(--text-secondary)]/20 rounded mb-2"></div>
              <div className="w-11/12 h-1.5 bg-[var(--text-secondary)]/20 rounded mb-2"></div>
              <div className="w-full h-1.5 bg-[var(--text-secondary)]/20 rounded mb-2"></div>
              <div className="w-4/5 h-1.5 bg-[var(--text-secondary)]/20 rounded"></div>
              
              {/* AI Button */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#F97316] to-[#EA580C] px-4 py-1.5 rounded-full text-white text-[10px] font-bold shadow-lg flex items-center gap-1.5 border border-orange-400/50 whitespace-nowrap">
                <Sparkles size={12} className="animate-pulse" /> Summarize with AI
              </div>
            </div>

            {/* Foreground AI Summary */}
            <div className="absolute bottom-0 left-0 w-72 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl p-4 shadow-2xl -rotate-2 transition-transform duration-500 group-hover:rotate-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-[#F97316]/10 rounded flex items-center justify-center text-[#F97316]"><BrainCircuit size={14}/></div>
                <div className="text-sm font-bold text-[var(--text-primary)]">AI Summary</div>
              </div>
              <ul className="text-[11px] text-[var(--text-secondary)] space-y-2 font-medium">
                <li className="flex items-start gap-2"><div className="text-[#F97316] mt-0.5">✦</div> Build a solution to improve campus sustainability.</li>
                <li className="flex items-start gap-2"><div className="text-[#F97316] mt-0.5">✦</div> Focus on real-world impact and scalability.</li>
                <li className="flex items-start gap-2"><div className="text-[#F97316] mt-0.5">✦</div> Open to creative ideas across any domain.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Dynamic Attendance */}
        <div className="group border border-[var(--border)] bg-[var(--bg-elevated)]/40 backdrop-blur-md rounded-3xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60">
          <div className="mb-12 relative z-10">
            <span className="font-mono text-xl font-bold text-[#F97316] mb-4 block">04</span>
            <h3 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-4">
              Dynamic <span className="text-[#F97316]">Attendance</span>
            </h3>
            <p className="font-sans text-[var(--text-secondary)] text-lg mb-6 leading-relaxed max-w-sm">
              Track participant attendance seamlessly with QR codes, real-time analytics, and instant reports.
            </p>
            <a href="/attendance/select" className="inline-flex items-center gap-2 text-[#F97316] font-semibold hover:gap-3 transition-all">
              Learn more <ArrowRight size={18} />
            </a>
          </div>

          {/* Mock UI */}
          <div className="relative w-full h-[220px] flex gap-4 z-10">
            {/* QR Card */}
            <div className="w-44 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl p-4 shadow-xl flex flex-col items-center transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-[-2deg]">
              <div className="text-xs font-bold text-[var(--text-primary)] w-full text-center mb-3 pb-2 border-b border-[var(--border)]">Mark Attendance</div>
              <div className="flex gap-1 w-full bg-[var(--bg-elevated)] p-1 rounded-lg mb-4">
                <div className="w-1/2 py-1 bg-[#F97316] rounded shadow-sm text-center text-white text-[9px] font-bold">QR Code</div>
                <div className="w-1/2 py-1 text-center text-[var(--text-secondary)] text-[9px] font-medium">Manual</div>
              </div>
              <div className="w-24 h-24 bg-white rounded-lg p-2 flex items-center justify-center">
                <QrCode size={80} className="text-black" strokeWidth={1.5} />
              </div>
              <div className="text-[9px] text-[var(--text-secondary)] mt-3">Scan to mark attendance</div>
            </div>

            {/* Stats Card */}
            <div className="flex-1 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-2xl p-4 shadow-lg flex flex-col transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-2">
              <div className="flex justify-between items-start mb-3">
                <div className="text-xs font-bold text-[var(--text-primary)]">Today's Attendance</div>
                <div className="w-6 h-6 bg-[#F97316]/10 text-[#F97316] rounded-md flex items-center justify-center"><CheckCircle2 size={12}/></div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full border-[3px] border-green-500 border-r-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                  87%
                </div>
                <div className="text-[10px] space-y-1 text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Present: <span className="text-[var(--text-primary)] font-bold">452</span></div>
                  <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Absent: <span className="text-[var(--text-primary)] font-bold">66</span></div>
                </div>
              </div>

              <div className="space-y-2 border-t border-[var(--border)] pt-2">
                {[
                  {n: "Aarav Sharma", t: "10:04 AM", img: "bg-indigo-500"},
                  {n: "Priya Verma", t: "10:06 AM", img: "bg-rose-500"}
                ].map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full ${u.img} border border-[var(--border)]`}></div>
                    <div>
                      <div className="text-[10px] font-bold text-[var(--text-primary)] leading-none">{u.n}</div>
                      <div className="text-[8px] text-[var(--text-secondary)]">Checked in - {u.t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
