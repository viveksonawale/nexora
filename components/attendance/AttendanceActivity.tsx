interface ActivityItem {
  id: string;
  name: string;
  team: string;
  timestamp: string;
}

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: "NX-204", name: "Alice Chen", team: "Quantum", timestamp: "10:42:15" },
  { id: "NX-811", name: "Marcus Johnson", team: "Cybernetics", timestamp: "10:41:03" },
  { id: "NX-105", name: "Priya Patel", team: "NeuralNet", timestamp: "10:38:44" },
  { id: "NX-922", name: "David Kim", team: "Quantum", timestamp: "10:35:21" },
  { id: "NX-304", name: "Sarah Connor", team: "Resistance", timestamp: "10:32:09" },
];

import { SpotlightCard } from "@/app/components/SpotlightCard";

export function AttendanceActivity() {
  return (
    <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.15)" className="group border-[var(--border)] rounded-3xl bg-[var(--bg-elevated)]/40 backdrop-blur-md hover:border-[#F97316]/50 hover:bg-[var(--bg-elevated)]/60 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 overflow-hidden h-full">
      <div className="flex flex-col h-full">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 group-hover:bg-[#F97316]/15 transition-colors duration-500 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-5 border-b border-[var(--border)]">
          <h3 className="font-sans text-lg font-medium text-[var(--text-primary)] group-hover:text-[#F97316] transition-colors">Recent Activity</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-canvas)]/40">
                <th className="py-3 px-5 font-mono text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">ID</th>
                <th className="py-3 px-5 font-mono text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Participant</th>
                <th className="py-3 px-5 font-mono text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ACTIVITY.map((activity) => (
                <tr key={activity.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-canvas)]/80 transition-colors">
                  <td className="py-3 px-5 font-mono text-sm text-[var(--text-secondary)]">{activity.id}</td>
                  <td className="py-3 px-5">
                    <div className="font-sans text-sm font-semibold text-[var(--text-primary)]">{activity.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-0.5">{activity.team}</div>
                  </td>
                  <td className="py-3 px-5 font-mono text-sm text-[#F97316]">{activity.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </SpotlightCard>
  );
}
