"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/app/components/Navbar";
import { SpotlightCard } from "@/app/components/SpotlightCard";
import { QRScanner } from "@/components/attendance/QRScanner";
import { AttendanceConfirmationDialog } from "@/components/attendance/AttendanceConfirmationDialog";
import { validateQR } from "@/lib/attendance/validate-qr";
import { getRandomConfirmationMessage } from "@/lib/attendance/attendance-messages";
import { getSession, AttendanceSession } from "@/lib/attendance/attendance-session";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function StudentAttendancePage() {
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [isSuccessDialogVisible, setIsSuccessDialogVisible] = useState(false);
  const [hasMarkedAttendance, setHasMarkedAttendance] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);

  // Sync session with storage events
  useEffect(() => {
    const fetchSession = () => setSession(getSession());
    fetchSession();

    const handleStorageChange = () => fetchSession();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    if (hasMarkedAttendance || isSuccessDialogVisible) return;
    
    setScanError(null);
    const result = validateQR(decodedText);
    
    if (result.valid) {
      setDialogMessage(getRandomConfirmationMessage());
      setIsSuccessDialogVisible(true);
      // In a real app, you would make an API call here to mark attendance.
    } else {
      setScanError(result.message);
    }
  };

  const handleConfirmDialog = () => {
    setIsSuccessDialogVisible(false);
    setHasMarkedAttendance(true);
    // Persist this locally for MVP to avoid duplicate scans
    if (session) {
      sessionStorage.setItem(`attendance_marked_${session.id}`, "true");
    }
  };

  const handleCancelDialog = () => {
    setIsSuccessDialogVisible(false);
  };

  useEffect(() => {
    if (session) {
      const marked = sessionStorage.getItem(`attendance_marked_${session.id}`);
      if (marked === "true") {
        setHasMarkedAttendance(true);
      } else {
        setHasMarkedAttendance(false);
      }
    }
  }, [session?.id]);

  const isActive = session?.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Navbar />
      <div className="relative pt-32 pb-16 px-6 md:px-12 flex flex-col items-center min-h-[80vh]">
        
        <div className="w-full max-w-md mb-6">
          <Link href="/attendance/select" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft size={16} /> Back to role selection
          </Link>
        </div>

        <div className="relative z-10 text-center mb-8 max-w-2xl">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Mark Your <span className="text-[#F97316]">Attendance</span>
          </h1>
          <p className="font-sans text-base text-[var(--text-secondary)]">
            Scan the active Nexora attendance QR code to check in.
          </p>
        </div>

        <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="w-full max-w-md p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md">
          
          {hasMarkedAttendance ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-xl font-bold mb-2">Attendance Marked</h2>
              <p className="text-[var(--text-secondary)] text-sm">Your attendance has been recorded for this session.</p>
            </div>
          ) : isActive ? (
            <div className="flex flex-col items-center">
              <div className="w-full mb-6">
                <QRScanner 
                  isActive={isActive && !isSuccessDialogVisible} 
                  onScanSuccess={handleScanSuccess}
                />
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-[10px] font-bold text-green-500 uppercase tracking-widest">
                    Session Active
                  </span>
                </div>
                {scanError && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{scanError}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F97316]/10 text-[#F97316] flex items-center justify-center mb-6 opacity-50">
                <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-[var(--text-secondary)]">Attendance session is currently unavailable.</h2>
              <p className="text-[var(--text-secondary)] text-sm opacity-80">Please wait for the organizer to start the session.</p>
            </div>
          )}
        </SpotlightCard>
      </div>

      <AttendanceConfirmationDialog
        isOpen={isSuccessDialogVisible}
        message={dialogMessage}
        onConfirm={handleConfirmDialog}
        onCancel={handleCancelDialog}
      />
    </div>
  );
}
