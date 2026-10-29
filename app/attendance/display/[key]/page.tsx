"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { LoadingState } from "@/components/shared/states";
import {
  Users,
  Clock,
  Maximize2,
  Minimize2,
  AlertTriangle,
  ShieldCheck,
  PauseCircle,
  StopCircle,
} from "lucide-react";

interface DisplayData {
  session: {
    id: string;
    hackathonId: string;
    hackathonTitle: string;
    title: string;
    status: "ACTIVE" | "PAUSED" | "ENDED";
  };
  checkedInCount: number;
}

interface TokenData {
  status: "ACTIVE" | "PAUSED" | "ENDED";
  token: string | null;
  secondsRemaining: number;
  checkedInCount: number;
}

export default function AttendanceDisplayPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayInfo, setDisplayInfo] = useState<DisplayData | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(7);
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED" | "ENDED">("ACTIVE");
  const [checkedInCount, setCheckedInCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Initial Access Verification
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace(`/sign-in?returnUrl=${encodeURIComponent(`/attendance/display/${key}`)}`);
      return;
    }

    async function verify() {
      try {
        const data = await apiFetch<DisplayData>(`/attendance/display/${key}`);
        setDisplayInfo(data);
        setStatus(data.session.status);
        setCheckedInCount(data.checkedInCount);
        setLoading(false);
      } catch (err: any) {
        if (err.status === 401) {
          router.replace(`/sign-in?returnUrl=${encodeURIComponent(`/attendance/display/${key}`)}`);
          return;
        }
        setError(
          err.message ||
            "Access Denied: You do not have organizer permissions for this session or the display key is invalid."
        );
        setLoading(false);
      }
    }

    verify();
  }, [user, authLoading, key, router]);

  // 2. Poll Token Endpoint (Strictly returns token, timer, count - NO student names)
  useEffect(() => {
    if (loading || error || !displayInfo) return;

    const fetchToken = async () => {
      try {
        const res = await apiFetch<TokenData>(`/attendance/display/${key}/token`);
        if (res) {
          setStatus(res.status);
          setToken(res.token);
          setSecondsRemaining(res.secondsRemaining);
          setCheckedInCount(res.checkedInCount);
        }
      } catch (err: any) {
        console.error("Token poll failed:", err);
      }
    };

    fetchToken();
    const interval = setInterval(fetchToken, 1000); // 1s poll for exact server sync
    return () => clearInterval(interval);
  }, [loading, error, displayInfo, key]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingState message="Verifying secure projector display key..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#090a0c] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#14151a] border border-red-500/30 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-display font-bold text-white">403 Forbidden</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs transition-colors"
          >
            Back to Organizer Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#090a0c] text-white flex flex-col justify-between p-6 md:p-12 select-none relative overflow-hidden font-sans"
    >
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#F97316]/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Bar: Hackathon Title, Status & Fullscreen toggle */}
      <header className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center text-[#F97316]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F97316] bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                Live Attendance
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {displayInfo?.session.hackathonTitle}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight mt-0.5">
              {displayInfo?.session.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border uppercase tracking-wider ${
              status === "ACTIVE"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : status === "PAUSED"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status === "ACTIVE"
                  ? "bg-emerald-400 animate-pulse"
                  : status === "PAUSED"
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
            />
            {status}
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            title="Toggle Fullscreen"
            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      {/* Main Center Area: Large Dynamic QR Code & Countdown */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-6">
        {status === "ACTIVE" && token ? (
          <div className="flex flex-col items-center">
            {/* High-Contrast Large QR Container */}
            <div className="p-7 md:p-9 bg-white rounded-3xl shadow-2xl shadow-orange-500/10 border-4 border-[#F97316]/30 animate-in fade-in zoom-in-95 duration-300">
              <QRCodeSVG
                value={token}
                size={340}
                bgColor="#ffffff"
                fgColor="#090a0c"
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Rotation Countdown Pill */}
            <div className="mt-8 flex items-center gap-3 px-5 py-2 rounded-full bg-zinc-900/90 border border-zinc-700/60 shadow-lg">
              <Clock size={16} className="text-[#F97316] animate-spin" />
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                Rotates in:
              </span>
              <span className="text-lg font-mono font-bold text-white">
                00:{secondsRemaining.toString().padStart(2, "0")}s
              </span>
            </div>
          </div>
        ) : status === "PAUSED" ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-zinc-900/60 border border-amber-500/20 rounded-3xl max-w-lg">
            <PauseCircle size={64} className="text-amber-400 mb-4 animate-pulse" />
            <h2 className="text-2xl font-display font-bold text-white mb-2">Session Paused</h2>
            <p className="text-sm text-zinc-400">
              The organizer has temporarily paused attendance recording. Please wait for the QR code to resume.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-zinc-900/60 border border-red-500/20 rounded-3xl max-w-lg">
            <StopCircle size={64} className="text-red-400 mb-4" />
            <h2 className="text-2xl font-display font-bold text-white mb-2">Session Ended</h2>
            <p className="text-sm text-zinc-400">
              Attendance check-in for this session is officially closed.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Bar: ONLY Checked-in Count (Strictly zero student names or list) */}
      <footer className="relative z-10 flex items-center justify-center border-t border-zinc-800/80 pt-6">
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#14151a] border border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center">
            <Users size={18} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-extrabold text-white">
              {checkedInCount}
            </span>
            <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
              Students Checked In
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
