"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateDemoQRValue } from "@/lib/attendance/qr-demo";
import { SpotlightCard } from "@/app/components/SpotlightCard";

interface QRDisplayProps {
  status: "ACTIVE" | "PAUSED" | "ENDED";
  sessionId?: string;
}

export function QRDisplay({ status, sessionId }: QRDisplayProps) {
  const [countdown, setCountdown] = useState(5);
  const [rotation, setRotation] = useState(1);
  const [qrValue, setQrValue] = useState("");

  useEffect(() => {
    // Generate initial QR value when status becomes active
    if (status === "ACTIVE" && qrValue === "" && sessionId) {
      setQrValue(generateDemoQRValue(sessionId, rotation));
    }
  }, [status, qrValue, rotation, sessionId]);

  useEffect(() => {
    if (status !== "ACTIVE") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRotation((r) => r + 1);
          if (sessionId) {
            setQrValue(generateDemoQRValue(sessionId, rotation + 1));
          }
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, rotation]);

  // Reset countdown if paused or ended
  useEffect(() => {
    if (status !== "ACTIVE") {
      setCountdown(5);
      if (status === "ENDED") {
        setQrValue("");
        setRotation(1);
      }
    }
  }, [status]);

  return (
    <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="group p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 min-h-[400px]">
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#F97316]/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4 group-hover:bg-[#F97316]/15 transition-colors duration-500 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full transform transition-transform duration-500 group-hover:-translate-y-2">
        {status === "ACTIVE" ? (
          <>
            <div className="mb-8 p-5 bg-white rounded-2xl shadow-xl border border-[#F97316]/20 group-hover:shadow-orange-500/20 group-hover:border-[#F97316]/60 transition-all duration-500 rotate-0 group-hover:rotate-1">
              <QRCodeSVG 
                value={qrValue} 
                size={280} 
                bgColor="#ffffff"
                fgColor="#14130f"
                level="H"
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="font-mono text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                QR Valid For
              </div>
              <div className="font-display text-5xl font-extrabold text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors drop-shadow-sm">
                00:{countdown.toString().padStart(2, '0')}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F97316]/10 border border-[#F97316]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
                <span className="font-mono text-[10px] font-bold text-[#F97316] uppercase tracking-widest">
                  Rotation: {rotation.toString().padStart(4, '0')}
                </span>
              </div>

              {/* Demo scan simulation link */}
              {/* <a 
                href="/attendance/confirm" 
                target="_blank"
                className="mt-6 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[#F97316] underline underline-offset-4 opacity-70 hover:opacity-100 transition-all flex items-center gap-1"
              >
                Simulate Participant Scan ↗
              </a> */}
            </div>
          </>
        ) : status === "PAUSED" ? (
          <div className="flex flex-col items-center justify-center">
            <div className="mb-8 relative w-[280px] h-[280px] bg-[var(--bg-canvas)] border-2 border-dashed border-[#F97316] rounded-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[#F97316]/5 animate-pulse" />
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#F97316] to-transparent absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
              <div className="font-mono text-sm text-[#F97316] font-bold uppercase tracking-widest text-center">Waiting for<br/>Session Start</div>
            </div>
            <div className="font-mono text-xl font-bold uppercase tracking-widest mb-3 text-[#F97316]">Session Paused</div>
            <div className="font-sans text-base text-[var(--text-secondary)]">Resume to display active QR code</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="mb-8 relative w-[280px] h-[280px] bg-[var(--bg-canvas)] border-2 border-dashed border-red-500/50 rounded-2xl flex items-center justify-center overflow-hidden opacity-50">
              <div className="font-mono text-sm text-red-500 font-bold uppercase tracking-widest">Session Closed</div>
            </div>
            <div className="font-mono text-xl font-bold uppercase tracking-widest mb-3 text-[var(--text-secondary)]">Session Ended</div>
            <div className="font-sans text-base text-[var(--text-secondary)]">This attendance session is closed</div>
          </div>
        )}
      </div>
      </div>
    </SpotlightCard>
  );
}
