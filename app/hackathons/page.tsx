"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { ShinyButton } from "../components/ShinyButton";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Users,
  Clock,
  Trophy,
  ArrowUpRight,
  ChevronRight,
  Wifi,
  WifiOff,
  ChevronDown,
  X,
  Flame,
  CalendarDays,
  Globe,
  Link2,
} from "lucide-react";

import { hackathons } from "../data/hackathons";

const FILTERS = ["All", "Live", "Open", "Upcoming", "Online", "Offline"];
type SortKey = "date" | "prize" | "participants";

// ─── Card ──────────────────────────────────────────────────────────────────────
function HackathonCard({ h }: { h: (typeof hackathons)[0] }) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/hackathons/${h.slug}`)}
      className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)]/70 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/90 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* Ambient Orange Glow on hover */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#F97316]/10 transition-colors duration-500 pointer-events-none" />

      {/* ── Top Row: Title, College & Social Links ── */}
      <div className="p-6 pb-4 flex items-start justify-between gap-4 relative z-10">
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors leading-tight">
            {h.name}
          </h3>
          <p className="font-sans text-sm font-medium text-[var(--text-secondary)] mt-1 truncate">
            {h.college}
          </p>
        </div>

        {/* Circular Link & Social Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            aria-label="Website Link"
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-[var(--bg-canvas)] hover:bg-[#F97316]/15 border border-[var(--border)] hover:border-[#F97316]/40 text-[var(--text-secondary)] hover:text-[#F97316] flex items-center justify-center transition-all"
          >
            <Link2 size={18} />
          </button>
          <button
            aria-label="Twitter / X"
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-[var(--bg-canvas)] hover:bg-[#F97316]/15 border border-[var(--border)] hover:border-[#F97316]/40 text-[var(--text-secondary)] hover:text-[#F97316] flex items-center justify-center transition-all font-bold text-sm"
          >
            𝕏
          </button>
        </div>
      </div>

      {/* ── Middle Row: Theme & Participants (Orange-accented Strip) ── */}
      <div className="px-6 py-4 bg-[var(--bg-canvas)]/60 dark:bg-[var(--bg-canvas)]/40 border-y border-[var(--border)] flex items-center justify-between gap-4 relative z-10">
        <div>
          <div className="font-mono text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">
            THEME
          </div>
          <span className="inline-block font-mono text-xs font-semibold px-4 py-1.5 rounded-full border border-[#F97316]/30 text-[#F97316] bg-[#F97316]/10 uppercase tracking-wider shadow-xs">
            {h.theme}
          </span>
        </div>

        <div className="flex items-center">
          <div className="flex items-center -space-x-2 mr-3">
            {h.avatars.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Participant avatar"
                className="w-7 h-7 rounded-full border-2 border-[var(--bg-elevated)] object-cover shadow-xs"
              />
            ))}
          </div>
          <span className="font-mono text-sm font-bold text-[#F97316] whitespace-nowrap">
            +{h.participants} participating
          </span>
        </div>
      </div>

      {/* ── Bottom Row: Status Tags & Apply Now ── */}
      <div className="p-6 pt-5 flex items-center justify-between gap-3 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider">
            {h.mode}
          </span>
          <span className="font-mono text-[11px] font-bold px-3.5 py-2 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] uppercase tracking-wider">
            {h.status}
          </span>
          <span className="font-mono text-[11px] font-bold px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider">
            {h.starts}
          </span>
        </div>

        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-semibold text-sm shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap">
          Apply now
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HackathonsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sort, setSort] = useState<SortKey>("date");
  const [showSort, setShowSort] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        e.stopPropagation();
        if (searchInputRef.current) {
          searchInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          searchInputRef.current.focus({ preventScroll: true });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  const filtered = hackathons
    .filter((h) => {
      const matchSearch =
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.college.toLowerCase().includes(search.toLowerCase()) ||
        h.location.toLowerCase().includes(search.toLowerCase()) ||
        h.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchFilter =
        activeFilter === "All" ||
        (activeFilter === "Live" && h.isLive) ||
        (activeFilter === "Open" && h.status === "Open") ||
        (activeFilter === "Upcoming" && h.status === "Upcoming") ||
        (activeFilter === "Online" && h.mode === "Online") ||
        (activeFilter === "Offline" && h.mode === "Offline");

      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sort === "date")
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      if (sort === "prize")
        return (
          parseInt(b.prize.replace(/\D/g, "")) -
          parseInt(a.prize.replace(/\D/g, ""))
        );
      if (sort === "participants") return b.participants - a.participants;
      return 0;
    });

  const liveCount = hackathons.filter((h) => h.isLive).length;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Navbar />

      {/* ── Hero / Header ──────────────────────────────────────── */}
      <div className="relative pt-32 pb-16 px-6 md:px-12 overflow-hidden">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F97316]/8 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-[#F97316]/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Title */}
          <h1 className="font-display text-center text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-5">
            Explore{" "}
            <span className="bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#EA580C] bg-clip-text text-transparent italic font-accent font-normal">
              Hackathons
            </span>
          </h1>
          <p className="text-center font-sans text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
            Discover competitions happening across India and the globe. Find
            your next challenge, form your team, and ship something great.
          </p>

          {/* Search Bar */}
          {/* Search & Actions Bar */}
          <div className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Capsule Container */}
            <div className="flex-1 flex items-center justify-between gap-3 p-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
              {/* Inner Input Box */}
              <div
                onClick={() => searchInputRef.current?.focus()}
                className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)]/70 focus-within:border-[#F97316]/50 focus-within:ring-2 focus-within:ring-[#F97316]/10 transition-all cursor-text min-w-0"
              >
                <Search
                  size={17}
                  className="text-[var(--text-secondary)] shrink-0"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to begin search, or use the global shortcut"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm font-sans outline-none min-w-0"
                />
                {search && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch("");
                    }}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-md hover:bg-[var(--bg-elevated)] shrink-0"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Shortcut Hint */}
              <button
                type="button"
                onClick={() => {
                  searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  searchInputRef.current?.focus({ preventScroll: true });
                }}
                className="hidden sm:flex items-center gap-1.5 pr-1 select-none shrink-0 cursor-pointer"
              >
                <span className="px-3.5 py-1.5 min-w-[50px] h-10 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)] text-sm font-mono font-bold text-[var(--text-primary)] shadow-sm">
                  Ctrl
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)]/70 px-0.5 select-none">
                  +
                </span>
                <span className="px-3 py-1.5 min-w-[36px] h-10 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)] text-sm font-mono font-bold text-[var(--text-primary)] shadow-sm">
                  K
                </span>
              </button>
            </div>

            {/* Your Hackathons Button */}
            <button className="px-6 py-3.5 rounded-2xl bg-[#F97316]/10 hover:bg-[#F97316]/20 border border-[#F97316]/25 text-[#F97316] font-semibold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm">
              Your hackathons <ChevronRight size={17} />
            </button>
          </div>


        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-mono font-semibold uppercase tracking-wide border transition-all ${
                activeFilter === f
                  ? "bg-[#F97316] text-white border-[#F97316] shadow-lg shadow-orange-500/20"
                  : "border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-elevated)]/60 hover:border-[#F97316]/40 hover:text-[var(--text-primary)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mb-4 text-2xl">
              🔍
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">
              No hackathons found
            </h3>
            <p className="text-sm text-[var(--text-secondary)] font-sans">
              Try a different search term or filter.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveFilter("All");
              }}
              className="mt-6 text-[#F97316] text-sm font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((h) => (
              <HackathonCard key={h.id} h={h} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer CTA strip ────────────────────────────────────── */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)]/30 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl font-extrabold text-[var(--text-primary)] mb-1">
              Organizing a Hackathon?
            </h3>
            <p className="font-sans text-[var(--text-secondary)]">
              List your event on Nexora and reach thousands of developers.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <ShinyButton variant="secondary" size="md">
              Learn More <ArrowUpRight size={15} />
            </ShinyButton>
            <ShinyButton variant="primary" size="md">
              List Your Hackathon
            </ShinyButton>
          </div>
        </div>
      </div>
    </div>
  );
}
