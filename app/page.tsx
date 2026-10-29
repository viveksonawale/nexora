
import { Hero } from "./components/Hero";
import { ShinyButton } from "./components/ShinyButton";
import { SpotlightCard } from "./components/SpotlightCard";
import { FeaturesGrid } from "./components/FeaturesGrid";
import FeatureSection from "@/components/ui/stack-feature-section";
import { ArrowUpRight, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { hackathons as fallbackHackathons } from "./data/hackathons";

interface HackathonDisplayItem {
  id: string;
  slug: string;
  title: string;
  startsAt: Date | string;
  city?: string | null;
  mode?: string | null;
  computedPhase?: string | null;
}

export default async function Home() {
  // Fetch live hackathons first
  const liveHackathons = (await HackathonService.getHackathons({ phase: "Hacking", sort: "startsAt" })) || [];
  // Fetch all published hackathons
  const allHackathons = (await HackathonService.getHackathons({ sort: "startsAt" })) || [];

  const liveIds = new Set(liveHackathons.map((h) => h.id));
  const otherHackathons = allHackathons.filter((h) => !liveIds.has(h.id));

  // Sort remaining so open & upcoming hackathons come first
  const phasePriority: Record<string, number> = {
    "Registrations Open": 1,
    "Upcoming": 2,
    "Registrations Upcoming": 3,
    "Judging": 4,
    "Submissions Closed": 5,
    "Registrations Closed": 6,
    "Ended": 7,
  };

  otherHackathons.sort((a, b) => {
    const priorityA = phasePriority[a.computedPhase] ?? 99;
    const priorityB = phasePriority[b.computedPhase] ?? 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  let hackathons: HackathonDisplayItem[] = [...liveHackathons, ...otherHackathons];

  // Guarantee at least 3 hackathons displayed using fallback data if DB has < 3
  if (hackathons.length < 3) {
    const needed = 3 - hackathons.length;
    const fallbacks: HackathonDisplayItem[] = fallbackHackathons.slice(0, needed).map((f) => ({
      id: String(f.id),
      slug: f.slug,
      title: f.name,
      startsAt: new Date(f.startDate || "2026-10-29"),
      city: f.location,
      mode: f.mode,
      computedPhase: f.isLive ? "Hacking" : "Upcoming",
    }));
    hackathons = [...hackathons, ...fallbacks];
  }

  // Display 6 cards (2 full 3-column rows) if 6+ available, or at least 3 cards
  const displayCount = hackathons.length >= 6 ? 6 : Math.min(hackathons.length, 3);
  const displayedHackathons = hackathons.slice(0, displayCount);
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
          {displayedHackathons.map((hackathon) => (
            <SpotlightCard
              key={hackathon.id}
              spotlightColor="rgba(249, 115, 22, 0.22)"
              className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/90 backdrop-blur-md p-6 sm:p-7 transition-all duration-300 hover:border-[#F97316]/50 hover:shadow-xl hover:shadow-orange-500/5 group"
            >
              <div>
                {/* Header Badge: Mode + Phase */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] uppercase tracking-wider">
                    {hackathon.mode || "HYBRID"}
                  </span>
                  {hackathon.computedPhase === "Hacking" ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE NOW
                    </span>
                  ) : hackathon.computedPhase === "Registrations Open" ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-[#F97316]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
                      OPEN
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] uppercase">
                      {hackathon.computedPhase || "UPCOMING"}
                    </span>
                  )}
                </div>

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

        {/* View All Hackathons Action */}
        <div className="mt-14 flex justify-center">
          <Link href="/hackathons">
            <ShinyButton
              variant="secondary"
              size="lg"
              className="px-8 py-3.5 group hover:border-[#F97316]/70 transition-colors"
            >
              <span className="font-semibold text-sm">Explore All Hackathons</span>
              <ArrowUpRight
                size={18}
                className="text-[#F97316] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
              />
            </ShinyButton>
          </Link>
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
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                <Image src="/logo/logo.png" alt="Nexora Logo" width={32} height={32} className="object-contain" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-[var(--text-primary)]">
                Nexora
              </span>
            </Link>
          </div>
          
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="flex flex-col space-y-5">
              <h4 className="font-mono text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">Services</h4>
              <Link href="/hackathons" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Hackathons</Link>
              <Link href="/hackathons" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Bounties</Link>
              <Link href="/hackathons" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Projects</Link>
            </div>
            <div className="flex flex-col space-y-5">
              <h4 className="font-mono text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">Company</h4>
              <Link href="/about" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">About Us</Link>
              <Link href="/about" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Careers</Link>
              <a href="mailto:contact@nexora.app" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Contact</a>
            </div>
            <div className="flex flex-col space-y-5">
              <h4 className="font-mono text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">Legal</h4>
              <Link href="/about" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Privacy Policy</Link>
              <Link href="/about" className="font-sans text-sm font-medium text-[var(--text-secondary)] hover:text-[#F97316] transition-colors">Terms of Service</Link>
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
