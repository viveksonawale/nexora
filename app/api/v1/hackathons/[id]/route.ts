import { db } from "@/lib/server/db";
import { getAuth } from "@/lib/server/auth";
import { handle, HttpError } from "@/lib/server/http";
import { cardInclude, publicHackathon } from "@/lib/server/serialize";

export const GET = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const h = await db.hackathon.findUnique({ where: { id }, include: cardInclude });
  if (!h) throw new HttpError(404, "Hackathon not found", "NOT_FOUND");
  const a = await getAuth(req);
  const [reg, sub] = a
    ? await Promise.all([
        db.registration.findUnique({ where: { userId_hackathonId: { userId: a.id, hackathonId: id } } }),
        db.submission.findUnique({ where: { hackathonId_userId: { hackathonId: id, userId: a.id } } }),
      ])
    : [null, null];
  return publicHackathon(h, { isRegistered: !!reg, hasSubmitted: !!sub, isOwner: a?.id === h.organizerId });
});
