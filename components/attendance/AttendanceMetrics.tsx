interface AttendanceMetricsProps {
  registeredCount: number;
  presentCount: number;
}

import { SpotlightCard } from "@/app/components/SpotlightCard";

export function AttendanceMetrics({ registeredCount, presentCount }: AttendanceMetricsProps) {
  const percentage = registeredCount > 0 ? Math.round((presentCount / registeredCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="group p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#F97316]/15 transition-colors duration-500 pointer-events-none" />
        <div className="relative z-10">
          <div className="font-mono text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">Total Registered</div>
          <div className="font-display text-4xl font-extrabold text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors">{registeredCount}</div>
        </div>
      </SpotlightCard>
      <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="group p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#F97316]/15 transition-colors duration-500 pointer-events-none" />
        <div className="relative z-10">
          <div className="font-mono text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">Currently Present</div>
          <div className="font-display text-4xl font-extrabold text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors">{presentCount}</div>
        </div>
      </SpotlightCard>
      <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="group p-8 border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#F97316]/15 transition-colors duration-500 pointer-events-none" />
        <div className="flex items-center justify-between h-full">
          <div className="relative z-10 flex-1">
            <div className="font-mono text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">Attendance Rate</div>
            <div className="font-display text-4xl font-extrabold text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors">{percentage}%</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{registeredCount - presentCount} Absent</div>
          </div>
          
          {/* Circular Graph */}
          <div className="relative z-10 w-16 h-16 mr-2 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-[var(--border)]" strokeWidth="3" />
              <circle 
                cx="18" 
                cy="18" 
                r="16" 
                fill="none" 
                className="stroke-[#F97316] transition-all duration-1000 ease-out" 
                strokeWidth="3" 
                strokeDasharray="100 100" 
                strokeDashoffset={100 - percentage} 
                strokeLinecap="round" 
              />
            </svg>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}
