interface SessionStatusProps {
  status: "ACTIVE" | "PAUSED" | "ENDED";
}

import { SpotlightCard } from "@/app/components/SpotlightCard";

export function SessionStatus({ status }: SessionStatusProps) {
  return (
    <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="group p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 h-full">
      <div className="flex flex-col gap-4 h-full">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#F97316]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 group-hover:bg-[#F97316]/15 transition-colors duration-500 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="font-sans text-lg font-medium text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors mb-4">Session Status</h3>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="font-mono text-sm text-[var(--text-secondary)] w-24">STATE</div>
            <div className="flex items-center gap-2">
              {status === "ACTIVE" && <div className="h-2 w-2 rounded-full bg-[#F97316] animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />}
              {status === "PAUSED" && <div className="h-2 w-2 rounded-full bg-yellow-500" />}
              {status === "ENDED" && <div className="h-2 w-2 rounded-full bg-gray-500" />}
              <span className="font-mono text-sm text-[var(--text-primary)]">{status}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="font-mono text-sm text-[var(--text-secondary)] w-24">NETWORK</div>
            <div className="font-mono text-sm text-[var(--text-primary)]">LOCAL DEMO</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-sm text-[var(--text-secondary)] w-24">SYNC</div>
            <div className="font-mono text-sm text-[var(--text-primary)]">OFFLINE</div>
          </div>
        </div>
      </div>
      </div>
    </SpotlightCard>
  );
}
