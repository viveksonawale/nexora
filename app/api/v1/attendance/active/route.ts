import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";

// Student: active attendance sessions for hackathons I'm registered in.
export const GET = handle(async (req) => {
  const a = await requireAuth(req, ["PARTICIPANT"]);
  const sessions = await db.attendanceSession.findMany({
    where: { status: "ACTIVE", hackathon: { registrations: { some: { userId: a.id } } } },
    include: { hackathon: { select: { id: true, name: true } }, records: { where: { userId: a.id }, select: { id: true } } },
  });
  return {
    items: sessions.map((s) => ({
      sessionId: s.id, hackathonId: s.hackathon.id, hackathonName: s.hackathon.name,
      startedAt: s.startedAt.toISOString(), alreadyMarked: s.records.length > 0,
    })),
  };
});
