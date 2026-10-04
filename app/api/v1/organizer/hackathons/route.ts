import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
import { cardInclude, publicHackathon } from "@/lib/server/serialize";

export const GET = handle(async (req) => {
  const a = await requireAuth(req, ["ORGANIZER"]);
  const rows = await db.hackathon.findMany({ where: { organizerId: a.id }, orderBy: { startDate: "desc" }, include: cardInclude });
  return { items: rows.map((h) => publicHackathon(h)) };
});
