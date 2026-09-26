"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { ShinyButton } from "./ShinyButton";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();
  
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* ── Background Images ── */}
      <div
        className="absolute inset-0 z-0"
        style={{backgroundColor: 'var(--bg-canvas)', transition: 'background-color 0.6s cubic-bezier(0.4,0,0.2,1)'}}
      >
        {/* Dark mood image — full orange/sunset */}
        <Image
          src="/hero-background.png"
          alt="Nexora workspace dark theme"
          fill
          priority
          className="object-cover object-center pointer-events-none select-none hero-img-dark"
        />

        {/* Light mood image — daytime/bright */}
        <Image
          src="/hero-background-light.png"
          alt="Nexora workspace light theme"
          fill
          priority
          className="object-cover object-center pointer-events-none select-none hero-img-light"
        />

        {/* Dark overlay: dims the image and fades to canvas at the bottom — stays at ~42% in light mode */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none hero-overlay-dark"
          aria-hidden="true"
        />

        {/* Light-mode scrim: soft warm radial veil centred on the text so heading + paragraph are legible */}
        <div
          className="absolute inset-0 pointer-events-none hero-overlay-light-scrim"
          style={{background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(250,248,244,0.30) 0%, transparent 70%)'}}
          aria-hidden="true"
        />

        {/* Always-on canvas-colour fade at the very bottom so content below blends cleanly */}
        <div
          className="absolute bottom-0 inset-x-0 h-2/5 pointer-events-none"
          style={{background: 'linear-gradient(to top, var(--bg-canvas) 0%, transparent 100%)', transition: 'background 0.6s cubic-bezier(0.4,0,0.2,1)'}}
          aria-hidden="true"
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 text-center flex flex-col items-center pt-32 pb-20">
        {/* Eyebrow: Looping border link to /hackathons */}
        <Link
          href="/hackathons"
          className="group relative inline-flex items-center justify-center p-[1px] rounded-full overflow-hidden mb-6 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-[0_0_24px_rgba(249,115,22,0.4)]"
        >
          {/* Looping animated orange beam along border — eyebrow-beam class lets CSS boost it in light mode */}
          <span
            className="eyebrow-beam absolute inset-[-200%] animate-border-loop bg-[conic-gradient(from_0deg,transparent_0_65%,#F97316_85%,#FB923C_95%,transparent_100%)] pointer-events-none"
            aria-hidden="true"
          />

          {/* Inner badge — adapts to theme via CSS vars */}
          <span className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-elevated)]/95 backdrop-blur-md border border-[#F97316]/40 text-xs font-medium text-[var(--text-primary)] group-hover:border-[#F97316]/70 transition-colors duration-300">
            <span className="tracking-wide">Explore Hackathons</span>
            <ArrowRight
              size={13}
              className="text-[#F97316] transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>
        </Link>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-bold text-[var(--text-primary)] leading-[1.12] tracking-tight mb-6">
          Empowering the Next Wave of{" "}
          <span className="bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#EA580C] bg-clip-text text-transparent italic font-accent font-normal">
            Tech Innovators
          </span>
        </h1>

        <p className="font-sans text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
          The premier platform for hosting world-class hackathons, automated coding sprints,
          and elite engineering challenges worldwide.
        </p>

        {/* Shiny Buttons with onload & hover animations */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ShinyButton 
            variant="primary" 
            size="lg"
            onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
          >
            <span>Launch a Hackathon</span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1.5 transition-transform duration-200"
            />
          </ShinyButton>

          <ShinyButton 
            variant="secondary" 
            size="lg"
            onClick={() => router.push("/hackathons")}
          >
            <Sparkles size={16} className="text-[#F97316]" />
            <span>Explore Challenges</span>
          </ShinyButton>
        </div>
      </div>
    </section>
  );
}
