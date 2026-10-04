import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
import { cardInclude, publicHackathon } from "@/lib/server/serialize";

export const GET = handle(async (req) => {
  const a = await requireAuth(req);
  const regs = await db.registration.findMany({
    where: { userId: a.id },
    orderBy: { createdAt: "desc" },
    include: { hackathon: { include: cardInclude } },
  });
  return { items: regs.map((r) => publicHackathon(r.hackathon)) };
});
