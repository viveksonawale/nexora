import Link from "next/link";
import { Navbar } from "@/app/components/Navbar";
import { SpotlightCard } from "@/app/components/SpotlightCard";
import { ArrowRight, Settings, Scan } from "lucide-react";

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Navbar />
      <div className="relative pt-32 pb-16 px-6 md:px-12 flex flex-col items-center justify-center min-h-[80vh]">
        
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F97316]/10 rounded-full blur-3xl -translate-x-1/2" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F97316]/5 rounded-full blur-3xl translate-x-1/2" />
        </div>

        <div className="relative z-10 text-center mb-16 max-w-2xl">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Dynamic <span className="text-[#F97316]">Attendance</span>
          </h1>
          <p className="font-sans text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
            Choose how you want to access the attendance system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full relative z-10">
          
          {/* Admin Card */}
          <Link href="/attendance" className="block w-full outline-none">
            <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.2)" className="h-full p-8 md:p-10 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 group">
              <div className="w-14 h-14 rounded-2xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Settings size={28} />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors">
                Admin
              </h3>
              <p className="font-sans text-[var(--text-secondary)] mb-8 leading-relaxed">
                Create and control live attendance sessions, display the active QR code, and monitor participation.
              </p>
              <div className="inline-flex items-center gap-2 text-[#F97316] font-semibold group-hover:gap-3 transition-all">
                Continue as Admin <ArrowRight size={18} />
              </div>
            </SpotlightCard>
          </Link>

          {/* Student Card */}
          <Link href="/attendance/student" className="block w-full outline-none">
            <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.2)" className="h-full p-8 md:p-10 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 group">
              <div className="w-14 h-14 rounded-2xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Scan size={28} />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4 text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors">
                Student
              </h3>
              <p className="font-sans text-[var(--text-secondary)] mb-8 leading-relaxed">
                Scan the active attendance QR code to securely mark your participation.
              </p>
              <div className="inline-flex items-center gap-2 text-[#F97316] font-semibold group-hover:gap-3 transition-all">
                Continue as Student <ArrowRight size={18} />
              </div>
            </SpotlightCard>
          </Link>

        </div>
      </div>
    </div>
  );
}
