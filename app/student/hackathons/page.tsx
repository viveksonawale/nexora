"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  Trophy,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  Plus,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

type FilterTab = "ALL" | "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";

export default function MyHackathonsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    apiFetch("/me/registrations")
      .then((data: any) => {
        setRegistrations(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Failed to load registrations", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading your hackathons..." />;

  const filterHackathons = () => {
    return registrations.filter((reg) => {
      const status = reg.hackathon?.status;
      if (activeTab === "ALL") return true;
      if (activeTab === "UPCOMING") {
        return status === "REGISTRATION_OPEN" || status === "REGISTRATION_CLOSED" || status === "PUBLISHED";
      }
      if (activeTab === "ONGOING") {
        return status === "LIVE" || status === "SUBMISSION_CLOSED" || status === "JUDGING";
      }
      if (activeTab === "COMPLETED") {
        return status === "RESULTS_PUBLISHED" || status === "ARCHIVED";
      }
      if (activeTab === "CANCELLED") {
        return status === "CANCELLED" || reg.status === "WITHDRAWN";
      }
      return true;
    });
  };

  const filtered = filterHackathons();

  const getStatusBadge = (regStatus: string) => {
    switch (regStatus) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock size={12} /> Pending Approval
          </span>
        );
      case "WAITLISTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock size={12} /> Waitlisted
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-700/50 text-zinc-300">
            {regStatus}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            My Hackathons
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track your registered events, team rosters, submission milestones, and results.
          </p>
        </div>

        <Link href="/hackathons">
          <ShinyButton variant="primary" size="sm" className="gap-2 py-2 px-4 text-xs font-semibold">
            <Plus size={15} /> Find New Hackathons
          </ShinyButton>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e2026] pb-3 overflow-x-auto no-scrollbar">
        {(["ALL", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"] as FilterTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-orange-500/15 text-[#F97316] border border-orange-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {tab === "ALL"
                ? `All Events (${registrations.length})`
                : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Hackathons Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#14161b] border border-[#232630] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-[#F97316] flex items-center justify-center mx-auto">
            <Trophy size={28} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">No Hackathons Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              {activeTab === "ALL"
                ? "You haven't registered for any hackathons yet. Join one today to start your building journey."
                : `No ${activeTab.toLowerCase()} hackathons matching this filter.`}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/hackathons">
              <ShinyButton variant="primary" size="sm" className="py-2 px-4 text-xs">
                Explore Available Hackathons
              </ShinyButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((reg) => {
            const h = reg.hackathon;
            const team = reg.teamMember?.team;
            const isApproved = reg.status === "APPROVED";

            return (
              <div
                key={reg.id}
                className="p-6 rounded-3xl bg-[#14161b] border border-[#232630] hover:border-zinc-700 transition-all flex flex-col justify-between space-y-6 shadow-sm"
              >
                <div className="space-y-4">
                  {/* Top Bar: Mode and Registration Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                      {h.mode || "ONLINE"}
                    </span>
                    {getStatusBadge(reg.status)}
                  </div>

                  {/* Title and dates */}
                  <div>
                    <Link
                      href={`/hackathons/${h.id}`}
                      className="text-xl font-display font-bold text-white hover:text-[#F97316] transition-colors block"
                    >
                      {h.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-zinc-400" />
                        {new Date(h.startsAt).toLocaleDateString()} -{" "}
                        {new Date(h.endsAt).toLocaleDateString()}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Status: <strong className="text-zinc-300">{h.status}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Team Section */}
                  <div className="p-4 rounded-2xl bg-[#0d0e11] border border-[#1e2026] space-y-2">
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users size={13} /> Team Status
                      </span>
                      {team && (
                        <span className="text-[#F97316] font-mono text-[11px]">
                          {reg.teamMember?.role === "LEADER" ? "Team Leader" : "Member"}
                        </span>
                      )}
                    </div>

                    {team ? (
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold text-sm text-white">
                          {team.name}
                        </span>
                        <Link
                          href="/student/teams"
                          className="text-xs font-semibold text-[#F97316] hover:underline"
                        >
                          Manage Team →
                        </Link>
                      </div>
                    ) : isApproved ? (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-zinc-400">No team joined yet</span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/hackathons/${h.id}/teams/create`}
                            className="text-xs font-semibold text-[#F97316] hover:underline"
                          >
                            Create Team
                          </Link>
                          <span className="text-zinc-600">|</span>
                          <Link
                            href={`/hackathons/${h.id}/teams`}
                            className="text-xs font-semibold text-zinc-300 hover:text-white"
                          >
                            Find Team
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">
                        Team formation unlocks once registration is approved.
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-[#1e2026] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/hackathons/${h.id}/schedule`}
                      className="text-xs font-medium text-zinc-400 hover:text-white"
                    >
                      Schedule
                    </Link>
                    <span className="text-zinc-600">•</span>
                    <Link
                      href={`/hackathons/${h.id}/prizes`}
                      className="text-xs font-medium text-zinc-400 hover:text-white"
                    >
                      Prizes
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {team && isApproved && (
                      <Link
                        href={`/hackathons/${h.id}/submission`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1.5"
                      >
                        <FileText size={13} />
                        <span>Submission</span>
                      </Link>
                    )}
                    <Link
                      href={`/hackathons/${h.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors flex items-center gap-1"
                    >
                      <span>Event Page</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

