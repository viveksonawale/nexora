"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import {
  Settings,
  Users,
  Activity,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  PlayCircle,
  Lock,
  Award,
  Archive,
} from "lucide-react";

export default function HackathonOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState("");

  const fetchHackathon = () => {
    apiFetch(`/hackathons/${id}`)
      .then(setHackathon)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHackathon();
  }, [id]);

  const handleStateTransition = async (targetState: string, actionLabel: string) => {
    if (!confirm(`Are you sure you want to transition this hackathon to ${targetState}? (${actionLabel})`)) {
      return;
    }
    setTransitioning(true);
    setTransitionError("");

    try {
      await apiFetch(`/hackathons/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: targetState }),
      });
      fetchHackathon();
    } catch (err: any) {
      setTransitionError(err.message || "Failed to update hackathon lifecycle state.");
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) return <LoadingState message="Loading hackathon dashboard..." />;
  if (!hackathon) return <div className="p-8 text-red-500">Failed to load hackathon.</div>;

  const currentStatus = hackathon.status;

  // Derive next logical lifecycle state
  let nextTransition: { target: string; label: string; icon: any; color: string } | null = null;
  if (currentStatus === "DRAFT") {
    nextTransition = {
      target: "REGISTRATION_OPEN",
      label: "Publish & Open Registrations",
      icon: PlayCircle,
      color: "bg-emerald-600 hover:bg-emerald-500 text-white",
    };
  } else if (currentStatus === "REGISTRATION_OPEN") {
    nextTransition = {
      target: "REGISTRATION_CLOSED",
      label: "Close Registrations",
      icon: Lock,
      color: "bg-amber-600 hover:bg-amber-500 text-white",
    };
  } else if (currentStatus === "REGISTRATION_CLOSED") {
    nextTransition = {
      target: "LIVE",
      label: "Start Event (Go Live)",
      icon: PlayCircle,
      color: "bg-orange-600 hover:bg-orange-500 text-white",
    };
  } else if (currentStatus === "LIVE") {
    nextTransition = {
      target: "SUBMISSION_CLOSED",
      label: "Close Project Submissions",
      icon: Lock,
      color: "bg-purple-600 hover:bg-purple-500 text-white",
    };
  } else if (currentStatus === "SUBMISSION_CLOSED") {
    nextTransition = {
      target: "JUDGING",
      label: "Begin Judging Phase",
      icon: Activity,
      color: "bg-blue-600 hover:bg-blue-500 text-white",
    };
  } else if (currentStatus === "JUDGING") {
    nextTransition = {
      target: "RESULTS_PUBLISHED",
      label: "Publish Results & Certificates",
      icon: Award,
      color: "bg-green-600 hover:bg-green-500 text-white",
    };
  } else if (currentStatus === "RESULTS_PUBLISHED") {
    nextTransition = {
      target: "ARCHIVED",
      label: "Archive Hackathon",
      icon: Archive,
      color: "bg-zinc-700 hover:bg-zinc-600 text-white",
    };
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-1">
            {hackathon.title}
          </h1>
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
            <span>{new Date(hackathon.startsAt).toLocaleDateString()} – {new Date(hackathon.endsAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>Mode: {hackathon.mode}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/hackathons/${hackathon.slug || hackathon.id}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-xl font-sans text-xs font-medium transition-colors"
          >
            <ExternalLink size={14} /> Public Page
          </Link>
        </div>
      </div>

      {/* Lifecycle State Controller Banner */}
      <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-[var(--text-secondary)] tracking-wider">
              Hackathon Lifecycle State
            </span>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider ${
                currentStatus === "LIVE"
                  ? "bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse"
                  : currentStatus === "RESULTS_PUBLISHED"
                  ? "bg-green-500/20 text-green-500 border border-green-500/30"
                  : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
              }`}>
                {currentStatus}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-sans">
                {currentStatus === "DRAFT" && "Configuring event. Hidden from participants."}
                {currentStatus === "REGISTRATION_OPEN" && "Participant applications are open."}
                {currentStatus === "REGISTRATION_CLOSED" && "Registrations closed. Finalizing reviews."}
                {currentStatus === "LIVE" && "Hackathon is live! Live attendance & QR scan active."}
                {currentStatus === "SUBMISSION_CLOSED" && "Submissions locked. Preparing judging assignments."}
                {currentStatus === "JUDGING" && "Judges evaluating anonymized submissions."}
                {currentStatus === "RESULTS_PUBLISHED" && "Winners and certificates published."}
                {currentStatus === "ARCHIVED" && "Hackathon completed and read-only."}
              </span>
            </div>
          </div>

          {nextTransition && (
            <button
              onClick={() => handleStateTransition(nextTransition!.target, nextTransition!.label)}
              disabled={transitioning}
              className={`px-5 py-2.5 rounded-xl font-sans text-xs font-bold transition-all shadow-md flex items-center gap-2 ${nextTransition.color}`}
            >
              <nextTransition.icon size={15} />
              {transitioning ? "Updating..." : nextTransition.label}
            </button>
          )}
        </div>

        {transitionError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <ShieldAlert size={16} /> {transitionError}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-secondary)]">
            <Users size={18} />
            <h3 className="font-sans font-medium text-xs">Registrations</h3>
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)]">
            {hackathon.registrations?.length || 0}
          </div>
          <div className="text-xs font-sans text-orange-500 mt-2">
            Capacity: {hackathon.maxParticipants || "Unlimited"}
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-secondary)]">
            <Activity size={18} />
            <h3 className="font-sans font-medium text-xs">Project Submissions</h3>
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)]">
            {hackathon.submissions?.length || 0}
          </div>
          <div className="text-xs font-sans text-[var(--text-secondary)] mt-2">
            {currentStatus === "LIVE" ? "Submissions open" : "Submissions locked"}
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center gap-3 mb-2 text-[var(--text-secondary)]">
            <CheckCircle size={18} />
            <h3 className="font-sans font-medium text-xs">Attendance Check-ins</h3>
          </div>
          <div className="text-3xl font-display font-bold text-[var(--text-primary)]">
            {hackathon.registrations?.filter((r: any) => r.checkedInAt)?.length || 0}
          </div>
          <div className="text-xs font-sans text-[var(--text-secondary)] mt-2">
            Verified attendees
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-lg font-display font-bold text-[var(--text-primary)] mb-4">
          Management Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/dashboard/hackathons/${id}/setup`}
            className="flex items-center p-4 border border-[var(--border)] rounded-xl hover:border-orange-500/50 transition-colors group"
          >
            <div className="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center mr-3 text-orange-500">
              <Settings size={18} />
            </div>
            <div>
              <div className="font-sans font-semibold text-xs text-[var(--text-primary)] group-hover:text-orange-500 transition-colors">
                Setup Hackathon
              </div>
              <div className="text-[11px] font-sans text-[var(--text-secondary)]">
                Prizes, schedules, tracks
              </div>
            </div>
          </Link>

          <Link
            href={`/dashboard/hackathons/${id}/registrations`}
            className="flex items-center p-4 border border-[var(--border)] rounded-xl hover:border-orange-500/50 transition-colors group"
          >
            <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3 text-blue-500">
              <Users size={18} />
            </div>
            <div>
              <div className="font-sans font-semibold text-xs text-[var(--text-primary)] group-hover:text-orange-500 transition-colors">
                Review Applications
              </div>
              <div className="text-[11px] font-sans text-[var(--text-secondary)]">
                Approve, reject & waitlist
              </div>
            </div>
          </Link>

          <Link
            href={`/dashboard/hackathons/${id}/check-in`}
            className="flex items-center p-4 border border-[var(--border)] rounded-xl hover:border-orange-500/50 transition-colors group"
          >
            <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center mr-3 text-purple-500">
              <CheckCircle size={18} />
            </div>
            <div>
              <div className="font-sans font-semibold text-xs text-[var(--text-primary)] group-hover:text-orange-500 transition-colors">
                Attendance Check-in
              </div>
              <div className="text-[11px] font-sans text-[var(--text-secondary)]">
                Rotating dynamic QR session
              </div>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}
