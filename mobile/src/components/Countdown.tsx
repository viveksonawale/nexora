import { useEffect, useState } from "react";
import { AppText } from "./AppText";

const pad = (n: number) => String(n).padStart(2, "0");

/** Counts down to an ISO date. Shows "Started" once it passes. */
export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return <AppText variant="mono" color="success">Started</AppText>;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  return (
    <AppText variant="mono" color="cyan">
      {d > 0 ? `${d}d ` : ""}{pad(Math.floor((s % 86400) / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
    </AppText>
  );
}
