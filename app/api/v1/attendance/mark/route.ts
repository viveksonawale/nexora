import { z } from "zod";
import { decodeJwt, jwtVerify } from "jose";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { body, handle, HttpError } from "@/lib/server/http";

const schema = z.object({ token: z.string().min(10) });

export const POST = handle(async (req) => {
  const a = await requireAuth(req, ["PARTICIPANT"]);
  const { token } = await body(req, schema);

  let sid: string;
  try {
    sid = String(decodeJwt(token).sid);
  } catch {
    throw new HttpError(400, "This is not a Nexora attendance QR", "BAD_QR");
  }
  const session = await db.attendanceSession.findUnique({ where: { id: sid } });
  if (!session) throw new HttpError(400, "This is not a Nexora attendance QR", "BAD_QR");
  try {
    await jwtVerify(token, new TextEncoder().encode(session.qrSecret));
  } catch {
    throw new HttpError(400, "This QR has expired. Scan the code currently on screen.", "QR_EXPIRED");
  }
  if (session.status !== "ACTIVE") {
    throw new HttpError(409, session.status === "PAUSED" ? "Attendance is paused" : "Attendance has ended", "SESSION_INACTIVE");
  }
  const reg = await db.registration.findUnique({ where: { userId_hackathonId: { userId: a.id, hackathonId: session.hackathonId } } });
  if (!reg) throw new HttpError(403, "You are not registered for this hackathon", "NOT_REGISTERED");
  try {
    await db.attendanceRecord.create({ data: { sessionId: session.id, userId: a.id } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") throw new HttpError(409, "Attendance already marked", "ALREADY_MARKED");
    throw e;
  }
  const h = await db.hackathon.findUnique({ where: { id: session.hackathonId }, select: { name: true } });
  return { ok: true, hackathonName: h?.name ?? "" };
});
