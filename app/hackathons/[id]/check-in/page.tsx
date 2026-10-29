"use client";

import { use, useEffect, useState } from "react";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { QRScanner } from "@/components/attendance/QRScanner";
import { AttendanceConfirmation } from "@/components/attendance/AttendanceConfirmation";
import { SpotlightCard } from "@/app/components/SpotlightCard";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";
import Link from "next/link";
import {
  QrCode,
  ShieldAlert,
  AlertCircle,
  PauseCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
} from "lucide-react";

export default function StudentCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useSession();

  const [loading, setLoading] = useState(true);
  const [hackathon, setHackathon] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [session, setSession] = useState<{
    id: string;
    status: "ACTIVE" | "PAUSED" | "ENDED";
    title?: string;
  } | null>(null);

  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasMarkedAttendance, setHasMarkedAttendance] = useState(false);
  const [markedTimestamp, setMarkedTimestamp] = useState<string | null>(null);
  const [isAlreadyMarkedNotice, setIsAlreadyMarkedNotice] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [hackData, sessionData] = await Promise.all([
          apiFetch(`/hackathons/${id}`).catch(() => null),
          apiFetch(`/hackathons/${id}/attendance/sessions`).catch(() => null),
        ]);

        if (mounted) {
          setHackathon(hackData);
          setSession(sessionData as any);
        }

        // Check student's registration
        try {
          const regData: any = await apiFetch(`/hackathons/${id}/registrations/me`);
          if (mounted && regData) {
            setRegistration(regData);
            if (regData.checkedInAt) {
              setHasMarkedAttendance(true);
              setMarkedTimestamp(new Date(regData.checkedInAt).toLocaleTimeString());
            }
          }
        } catch {
          if (mounted) setRegistration(null);
        }
      } catch (err: any) {
        console.error("Failed to load student check-in data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    // Poll active session state every 3 seconds
    const interval = setInterval(() => {
      apiFetch(`/hackathons/${id}/attendance/sessions`)
        .then((s: any) => {
          if (mounted) setSession(s);
        })
        .catch(() => {});
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const handleScanSuccess = async (token: string) => {
    if (scanSubmitting || hasMarkedAttendance) return;

    setScanSubmitting(true);
    setScanError(null);
    setIsAlreadyMarkedNotice(false);

    try {
      const res: any = await apiFetch(`/hackathons/${id}/attendance/scan`, {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      if (res?.alreadyMarked) {
        setIsAlreadyMarkedNotice(true);
        setHasMarkedAttendance(true);
        if (res?.record?.markedAt) {
          setMarkedTimestamp(new Date(res.record.markedAt).toLocaleTimeString());
        }
      } else {
        setHasMarkedAttendance(true);
        setMarkedTimestamp(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      setScanError(
        err.message || "Failed to verify attendance. Please re-align camera with the screen QR."
      );
    } finally {
      setScanSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading check-in gateway..." />;
  }

  return (
    <RequireAuth requireVerified={true}>
      <div className="max-w-2xl mx-auto space-y-8 pb-16 px-4">
        {/* Header Title */}
        <div className="text-center space-y-2 pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#F97316] font-mono text-xs font-semibold uppercase tracking-wider mb-2">
            <QrCode size={13} />
            Participant Attendance
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-[var(--text-primary)]">
            Scan Event Attendance
          </h1>
          <p className="text-[var(--text-secondary)] font-sans text-sm max-w-md mx-auto">
            Point your camera at the rotating attendance QR code displayed on the venue projector screen.
          </p>
        </div>

        {/* 1. Already Marked Attendance Success View */}
        {hasMarkedAttendance ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {isAlreadyMarkedNotice && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium flex items-center justify-center gap-2 text-center">
                <CheckCircle2 size={16} />
                <span>Your attendance was already verified and recorded for this session.</span>
              </div>
            )}
            <AttendanceConfirmation
              participantName={user?.name}
              hackathonTitle={hackathon?.title}
              checkedInTime={markedTimestamp || undefined}
            />
            <div className="text-center">
              <Link
                href={`/hackathons/${id}/overview`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[#F97316]/50 text-[var(--text-primary)] font-medium text-sm transition-all"
              >
                Back to Hackathon Overview
              </Link>
            </div>
          </div>
        ) : !registration ? (
          /* 2. User Not Registered */
          <SpotlightCard
            spotlightColor="rgba(249, 115, 22, 0.15)"
            className="p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)] text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                Registration Required
              </h3>
              <p className="font-sans text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                You must be registered and approved for this event before you can record attendance.
              </p>
            </div>
            <Link
              href={`/hackathons/${id}/register`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white font-sans font-semibold text-sm transition-colors shadow-lg shadow-orange-500/20"
            >
              Register for {hackathon?.title || "Hackathon"}
            </Link>
          </SpotlightCard>
        ) : registration.status !== "APPROVED" ? (
          /* 3. Registration Pending or Waitlisted */
          <SpotlightCard
            spotlightColor="rgba(249, 115, 22, 0.15)"
            className="p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)] text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                Application Status: {registration.status}
              </h3>
              <p className="font-sans text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Only <strong className="text-emerald-500">APPROVED</strong> participants can record attendance. Please check back once the organizers have accepted your application.
              </p>
            </div>
          </SpotlightCard>
        ) : !session || session.status !== "ACTIVE" ? (
          /* 4. Session Paused or Not Active */
          <SpotlightCard
            spotlightColor="rgba(249, 115, 22, 0.15)"
            className="p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)] text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <PauseCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {session?.status === "PAUSED"
                  ? "Attendance Session Paused"
                  : session?.status === "ENDED"
                  ? "Attendance Session Closed"
                  : "Attendance Not Started Yet"}
              </h3>
              <p className="font-sans text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                {session?.status === "PAUSED"
                  ? "The organizers have temporarily paused the attendance session. Keep this page open; scanner will activate once resumed."
                  : session?.status === "ENDED"
                  ? "The attendance window for this event has concluded."
                  : "Waiting for event organizers to start the attendance session. This scanner will automatically activate once live."}
              </p>
            </div>
          </SpotlightCard>
        ) : (
          /* 5. Live Scanner (Strictly Camera Only through getUserMedia - no text input, no link input) */
          <div className="space-y-6">
            <div className="p-1 rounded-3xl bg-gradient-to-b from-orange-500/30 via-zinc-800 to-transparent">
              <div className="bg-[#111215] p-6 rounded-[22px] space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Session Live: {session.title || "Main Stage"}</span>
                </div>

                <QRScanner
                  isActive={true}
                  onScanSuccess={handleScanSuccess}
                  onScanError={() => {}}
                />

                {scanSubmitting && (
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#F97316] animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Verifying rotating token with server...</span>
                  </div>
                )}

                {scanError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center space-y-2">
                    <p className="font-medium">{scanError}</p>
                    <button
                      onClick={() => setScanError(null)}
                      className="px-4 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-mono text-[11px] transition-colors"
                    >
                      Scan Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
