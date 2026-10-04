import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { handle, HttpError } from "@/lib/server/http";

export const POST = handle(async (req, ctx) => {
  const a = await requireAuth(req, ["PARTICIPANT"]);
  const { id } = await ctx.params;
  const h = await db.hackathon.findUnique({ where: { id } });
  if (!h) throw new HttpError(404, "Hackathon not found", "NOT_FOUND");
  if (h.status === "ENDED") throw new HttpError(409, "Registration is closed", "CLOSED");
  await db.registration.upsert({
    where: { userId_hackathonId: { userId: a.id, hackathonId: id } },
    create: { userId: a.id, hackathonId: id },
    update: {},
  });
  return { ok: true };
});
