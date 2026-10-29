import { db } from "@/server/lib/db";

export type SessionStatus = "ACTIVE" | "PAUSED" | "ENDED";

export interface AttendanceSessionData {
  id: string;
  status: SessionStatus;
  startedAt: number | null;
  endedAt: number | null;
}

// In-memory store for active hackathon sessions
const sessionsByHackathon = new Map<string, AttendanceSessionData>();

export class AttendanceSessionService {
  static getSession(hackathonId: string): AttendanceSessionData {
    let session = sessionsByHackathon.get(hackathonId);
    if (!session) {
      session = {
        id: `SESSION_${hackathonId.slice(-6)}_${Date.now()}`,
        status: "ACTIVE", // Active by default when created
        startedAt: Date.now(),
        endedAt: null,
      };
      sessionsByHackathon.set(hackathonId, session);
    }
    return session;
  }

  static setSession(hackathonId: string, status: SessionStatus, customSessionId?: string): AttendanceSessionData {
    const existing = this.getSession(hackathonId);
    existing.status = status;
    if (customSessionId) {
      existing.id = customSessionId;
    }
    if (status === "ACTIVE" && !existing.startedAt) {
      existing.startedAt = Date.now();
      existing.endedAt = null;
    } else if (status === "ENDED") {
      existing.endedAt = Date.now();
    }
    sessionsByHackathon.set(hackathonId, existing);
    return existing;
  }

  static async getRecentCheckIns(hackathonId: string) {
    const registrations = await db.registration.findMany({
      where: {
        hackathonId,
        checkedInAt: { not: null },
      },
      orderBy: { checkedInAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true } },
        teamMember: { include: { team: { select: { id: true, name: true } } } },
      },
    });

    return registrations.map((r) => ({
      id: `REG-${r.id.slice(-4).toUpperCase()}`,
      name: r.user.name,
      team: r.teamMember?.team?.name || "Independent",
      timestamp: r.checkedInAt
        ? new Date(r.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "--:--:--",
    }));
  }
}
