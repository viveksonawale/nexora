import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { body, handle } from "@/lib/server/http";
import { cardInclude, publicHackathon } from "@/lib/server/serialize";

// Mirrors the website's /hackathons: search (name, college, location, tags),
// filters (all, live, open, upcoming, online, offline) and sort (date, prize, participants).
export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const filter = sp.get("filter") ?? "all";
  const sort = sp.get("sort") ?? "date";

  const where: Prisma.HackathonWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { college: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { tags: { hasSome: q.split(/[\s,]+/).filter(Boolean) } },
      { tags: { has: q } },
    ];
  }
  if (filter === "live") where.status = "LIVE";
  if (filter === "open") where.status = "OPEN";
  if (filter === "upcoming") where.status = "UPCOMING";
  if (filter === "online") where.mode = "ONLINE";
  if (filter === "offline") where.mode = "OFFLINE";

  const orderBy: Prisma.HackathonOrderByWithRelationInput =
    sort === "prize" ? { prize: "desc" } :
    sort === "participants" ? { registrations: { _count: "desc" } } :
    { startDate: "asc" };

  const rows = await db.hackathon.findMany({ where, orderBy, include: cardInclude });
  return { items: rows.map((h) => publicHackathon(h)) };
});

const create = z.object({
  name: z.string().trim().min(3),
  college: z.string().trim().default(""),
  location: z.string().trim().default(""),
  mode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]).default("ONLINE"),
  theme: z.string().trim().default(""),
  tags: z.array(z.string().trim()).default([]),
  description: z.string().default(""),
  problemStatement: z.string().default(""),
  prize: z.number().int().min(0).default(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const POST = handle(async (req) => {
  const a = await requireAuth(req, ["ORGANIZER"]);
  const d = await body(req, create);
  const h = await db.hackathon.create({
    data: {
      ...d,
      startDate: new Date(d.startDate),
      endDate: d.endDate ? new Date(d.endDate) : null,
      status: "OPEN",
      organizerId: a.id,
    },
    include: cardInclude,
  });
  return publicHackathon(h);
});
