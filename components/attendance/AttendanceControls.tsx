import { ShinyButton } from "@/app/components/ShinyButton";
import { SpotlightCard } from "@/app/components/SpotlightCard";

interface AttendanceControlsProps {
  status: "ACTIVE" | "PAUSED" | "ENDED";
  hasStarted: boolean;
  onStatusChange: (status: "ACTIVE" | "PAUSED" | "ENDED") => void;
}

export function AttendanceControls({ status, hasStarted, onStatusChange }: AttendanceControlsProps) {
  return (
    <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="group p-8 border-[var(--border)] mb-5 rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#F97316]/15 transition-colors duration-500 pointer-events-none" />
      <div className="flex flex-col md:flex-row gap-6 md:gap-4 items-start md:items-center justify-between w-full h-full">
        <div className="flex-1 relative z-10">
          <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors mb-1">Session Controls</h3>
          <p className="font-sans text-sm font-medium text-[var(--text-secondary)]">Manage the live attendance session.</p>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto md:ml-auto">
        {status !== "ACTIVE" && status !== "ENDED" && (
          <ShinyButton
            variant="primary"
            onClick={() => onStatusChange("ACTIVE")}
          >
            {hasStarted ? "Resume Session" : "Start Session"}
          </ShinyButton>
        )}

        {status === "ACTIVE" && (
          <ShinyButton
            variant="secondary"
            onClick={() => onStatusChange("PAUSED")}
          >
            Pause Session
          </ShinyButton>
        )}

        {hasStarted && status !== "ENDED" && (
          <ShinyButton
            variant="outline"
            onClick={() => onStatusChange("ENDED")}
            className="hover:!border-red-500/50 hover:!bg-red-500/10 hover:text-red-500"
          >
            End Session
          </ShinyButton>
        )}

        {status === "ENDED" && (
          <ShinyButton
            variant="primary"
            onClick={() => onStatusChange("ACTIVE")}
          >
            Start New Session
          </ShinyButton>
        )}
        </div>
      </div>
    </SpotlightCard>
  );
}
