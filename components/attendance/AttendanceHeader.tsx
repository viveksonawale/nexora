export function AttendanceHeader() {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--border)] mb-8">
      <div>
        <div className="group relative inline-flex items-center justify-center p-[1px] rounded-full overflow-hidden mb-6 transition-all duration-300 hover:shadow-[0_0_24px_rgba(249,115,22,0.4)]">
          <span
            className="eyebrow-beam absolute inset-[-200%] animate-border-loop bg-[conic-gradient(from_0deg,transparent_0_65%,#F97316_85%,#FB923C_95%,transparent_100%)] pointer-events-none"
            aria-hidden="true"
          />
          <span className="relative z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)]/95 backdrop-blur-md border border-[#F97316]/40 text-[10px] font-mono uppercase tracking-widest text-[#F97316] group-hover:border-[#F97316]/70 transition-colors duration-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F97316] animate-pulse" />
            <span className="tracking-wide">Live Operations</span>
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">Dynamic Attendance</h1>
        <p className="font-sans text-[var(--text-secondary)] mt-2">Hackathon Registration & Check-in Control Center</p>
      </div>
      <div className="text-right">
        <div className="font-mono text-xs text-[var(--text-secondary)] mb-1">STATION ID</div>
        <div className="font-mono text-sm text-[var(--text-primary)]">NX-G4T3-01</div>
      </div>
    </header>
  );
}
