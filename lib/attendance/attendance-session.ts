export type SessionStatus = "ACTIVE" | "PAUSED" | "ENDED";

export interface AttendanceSession {
  id: string;
  status: SessionStatus;
  startedAt: number | null;
  endedAt: number | null;
}

const SESSION_KEY = "nexora_attendance_session";

export const getSession = (): AttendanceSession | null => {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const startSession = (id: string) => {
  if (typeof window === "undefined") return;
  const session: AttendanceSession = {
    id,
    status: "ACTIVE",
    startedAt: Date.now(),
    endedAt: null,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("storage"));
};

export const updateSessionStatus = (status: SessionStatus) => {
  if (typeof window === "undefined") return;
  const current = getSession();
  if (current) {
    current.status = status;
    if (status === "ENDED") {
      current.endedAt = Date.now();
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event("storage"));
  }
};
