"use client";

import { useState, useEffect, useRef } from "react";
import { AttendanceHeader } from "@/components/attendance/AttendanceHeader";
import { AttendanceMetrics } from "@/components/attendance/AttendanceMetrics";
import { QRDisplay } from "@/components/attendance/QRDisplay";
import { SessionStatus } from "@/components/attendance/SessionStatus";
import { AttendanceActivity } from "@/components/attendance/AttendanceActivity";
import { AttendanceControls } from "@/components/attendance/AttendanceControls";
import { Navbar } from "@/app/components/Navbar";
import { getSession, startSession, updateSessionStatus, SessionStatus as TSessionStatus } from "@/lib/attendance/attendance-session";

export default function AttendancePage() {
  const [status, setStatus] = useState<TSessionStatus>("PAUSED");
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Initialize session from storage
    const current = getSession();
    if (current) {
      setStatus(current.status);
      setSessionId(current.id);
    }
  }, []);

  const handleStatusChange = (newStatus: TSessionStatus) => {
    setStatus(newStatus);
    if (newStatus === "ACTIVE" && (!sessionId || status === "ENDED")) {
      const newId = `SESSION_${Date.now()}`;
      setSessionId(newId);
      startSession(newId);
    } else {
      updateSessionStatus(newStatus);
    }
  };

  // Mock data for prototype
  const registeredCount = 142;
  const presentCount = status === "ACTIVE" ? 42 : 38;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Navbar />
      <div className="relative pt-32 pb-16 px-6 md:px-12 overflow-hidden">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F97316]/8 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-[#F97316]/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <AttendanceHeader />

          <AttendanceControls
            status={status}
            hasStarted={!!sessionId}
            onStatusChange={handleStatusChange}
          />

          <AttendanceMetrics
            registeredCount={registeredCount}
            presentCount={presentCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main QR Area */}
            <div className="lg:col-span-2">
              <QRDisplay status={status} sessionId={sessionId} />
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6">
              <div className="flex-none">
                <SessionStatus status={status} />
              </div>
              <div className="flex-1 min-h-[300px]">
                <AttendanceActivity />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
