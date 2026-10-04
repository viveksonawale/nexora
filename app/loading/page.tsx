import { LoadingSpinner } from "../components/LoadingSpinner";
import Image from "next/image";

export default function LoadingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-[var(--bg-elevated)]/40 border border-[var(--border)] backdrop-blur-md shadow-2xl">
        
        {/* Glowing Orange Logo representation */}
        <div className="w-16 h-16 mb-8 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[#F97316] blur-xl opacity-30 rounded-full animate-pulse"></div>
          <div className="w-12 h-12 flex items-center justify-center z-10">
            <Image src="/logo/logo.png" alt="Nexora Logo" width={48} height={48} className="object-contain" />
          </div>
        </div>

        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
          Authenticating...
        </h2>
        <p className="font-sans text-sm text-[var(--text-secondary)] mb-8">
          Please wait while we verify your credentials.
        </p>
        
        {/* The requested Loading Bars */}
        <LoadingSpinner />

      </div>
    </main>
  );
}
