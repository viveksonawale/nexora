
import { Hero } from "./components/Hero";
import { ContactForm } from "./components/ContactForm";
import { ShinyButton } from "./components/ShinyButton";
import { SpotlightCard } from "./components/SpotlightCard";
import { FeaturesGrid } from "./components/FeaturesGrid";
import FeatureSection from "@/components/ui/stack-feature-section";
import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";

export default async function Home() {
  const hackathons = await HackathonService.getHackathons({ phase: "Hacking", sort: "startsAt" });
  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Hero />

      {/* Live Hackathons Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 relative z-10 bg-transparent">
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center">
          {/* Hero-matched Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-md text-xs font-mono mb-4 shadow-sm hover:border-[#F97316]/50 transition-colors">
            <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
            <span className="text-[var(--text-secondary)] font-medium">
              Active Developer Challenges
            </span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight mb-4">
            Live{" "}
            <span className="bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#EA580C] bg-clip-text text-transparent italic font-accent font-normal">
              Hackathons
            </span>
          </h2>
          <p className="font-sans text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
            Discover active global sprints, build breakthrough software alongside top engineering teams, and claim your share of bounties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {hackathons.slice(0, 3).map((hackathon) => (
            <SpotlightCard
              key={hackathon.id}
              spotlightColor="rgba(249, 115, 22, 0.22)"
              className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/90 backdrop-blur-md p-6 sm:p-7 transition-all duration-300 hover:border-[#F97316]/50 hover:shadow-xl hover:shadow-orange-500/5 group"
            >
              <div>
                {/* Title */}
                <h3 className="font-display text-2xl font-bold text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors duration-200 mb-2 tracking-tight">
                  {hackathon.title}
                </h3>

                {/* Date below title */}
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] mb-6">
                  <Calendar size={14} className="text-[#F97316]" />
                  <span>{new Date(hackathon.startsAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                {/* Location above the button */}
                <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] mb-4">
                  <MapPin size={14} className="text-[#F97316]" />
                  <span>{hackathon.city || hackathon.mode}</span>
                </div>

                {/* Themed Interactive Button */}
                <Link href={`/hackathons/${hackathon.slug}`} className="block">
                  <ShinyButton
                    variant="secondary"
                    size="md"
                    className="w-full justify-between group/btn hover:border-[#F97316]/70 transition-colors"
                  >
                    <span className="font-medium text-sm">View Details</span>
                    <ArrowUpRight
                      size={16}
                      className="text-[#F97316] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                    />
                  </ShinyButton>
                </Link>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* Main Features Grid */}
      <FeaturesGrid />

      {/* Stack Feature Section */}
      <FeatureSection />

      {/* 8. Footer */}
      <footer className="bg-[var(--bg-canvas)] pt-20 pb-4 relative overflow-hidden flex flex-col justify-between border-t border-[var(--border)] z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 md:mb-32">
          <div className="lg:col-span-1">
            <a href="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                <Image src="/logo/logo.png" alt="Nexora Logo" width={32} height={32} className="object-contain" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-[var(--text-primary)]">
                Nexora
              </span>
            </a>
          </div>
          
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="flex flex-col space-y-5">
              <h4 className="font-mono text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">Services</h4>
              <a href="#" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Hackathons</a>
              <a href="#" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Bounties</a>
              <a href="#" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Projects</a>
            </div>
            <div className="flex flex-col space-y-5">
              <h4 className="font-mono text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">Company</h4>
              <a href="#" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">About Us</a>
              <a href="#" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Careers</a>
              <a href="#" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Contact</a>
            </div>
            <div className="flex flex-col space-y-5">
              <h4 className="font-mono text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">Legal</h4>
              <a href="#" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Privacy Policy</a>
              <a href="#" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>

        <div className="w-full relative flex flex-col items-center justify-center overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 md:px-12 w-full flex justify-between items-end mb-2 text-[10px] sm:text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider relative z-20">
              <div className="flex items-center gap-2">
                <span>EN</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-secondary)]"></span>
                <span>© 2026. All Rights Reserved.</span>
              </div>
           </div>
           
           <div className="w-full flex justify-center translate-y-[22%] relative z-10 pointer-events-none">
              <h1 className="font-display font-black text-[18vw] leading-[0.75] tracking-tighter text-[var(--text-primary)] whitespace-nowrap select-none">
                NEXORA
              </h1>
           </div>
        </div>
      </footer>

    </main>
  );
}
