import { randomBytes } from "crypto";
import { z } from "zod";
import { SignJWT } from "jose";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { body, handle, HttpError } from "@/lib/server/http";

export const QR_TTL_SECONDS = 45;

async function owned(userId: string, hackathonId: string) {
  const h = await db.hackathon.findUnique({ where: { id: hackathonId } });
  if (!h || h.organizerId !== userId) throw new HttpError(404, "Hackathon not found", "NOT_FOUND");
}

const openSession = (hackathonId: string) =>
  db.attendanceSession.findFirst({ where: { hackathonId, status: { in: ["ACTIVE", "PAUSED"] } }, orderBy: { startedAt: "desc" } });

// Organizer view: session state, metrics, recent activity and a short-lived signed QR token.
export const GET = handle(async (req, ctx) => {
  const a = await requireAuth(req, ["ORGANIZER"]);
  const { id } = await ctx.params;
  await owned(a.id, id);
  const [session, registered] = await Promise.all([openSession(id), db.registration.count({ where: { hackathonId: id } })]);
  if (!session) return { session: null, registered, present: 0, recent: [], qr: null };

  const [present, recent] = await Promise.all([
    db.attendanceRecord.count({ where: { sessionId: session.id } }),
    db.attendanceRecord.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true } } } }),
  ]);
  const qr = session.status === "ACTIVE"
    ? {
        token: await new SignJWT({ sid: session.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(`${QR_TTL_SECONDS}s`).sign(new TextEncoder().encode(session.qrSecret)),
        expiresInSeconds: QR_TTL_SECONDS,
      }
    : null;
  return {
    session: { id: session.id, status: session.status, startedAt: session.startedAt.toISOString() },
    registered, present, qr,
    recent: recent.map((r) => ({ name: r.user.name, at: r.createdAt.toISOString() })),
  };
});

const schema = z.object({ action: z.enum(["start", "pause", "resume", "end"]) });

export const POST = handle(async (req, ctx) => {
  const a = await requireAuth(req, ["ORGANIZER"]);
  const { id } = await ctx.params;
  await owned(a.id, id);
  const { action } = await body(req, schema);
  const session = await openSession(id);

  if (action === "start") {
    if (session) throw new HttpError(409, "A session is already open", "SESSION_OPEN");
    await db.attendanceSession.create({ data: { hackathonId: id, qrSecret: randomBytes(32).toString("hex") } });
  } else {
    if (!session) throw new HttpError(409, "No open session", "NO_SESSION");
    if (action === "pause" && session.status !== "ACTIVE") throw new HttpError(409, "Session is not active", "BAD_STATE");
    if (action === "resume" && session.status !== "PAUSED") throw new HttpError(409, "Session is not paused", "BAD_STATE");
    await db.attendanceSession.update({
      where: { id: session.id },
      data:
        action === "pause" ? { status: "PAUSED" } :
        action === "resume" ? { status: "ACTIVE" } :
        { status: "ENDED", endedAt: new Date() },
    });
  }
  return { ok: true };
});
