import { randomInt } from "crypto";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { body, handle, HttpError } from "@/lib/server/http";

const schema = z.object({
  title: z.string().trim().min(2),
  description: z.string().default(""),
  repoUrl: z.string().url().or(z.literal("")).default(""),
  demoUrl: z.string().url().or(z.literal("")).default(""),
});

const pub = (s: { id: string; projectCode: string; title: string; description: string; repoUrl: string; demoUrl: string }) => s;

export const GET = handle(async (req, ctx) => {
  const a = await requireAuth(req);
  const { id } = await ctx.params;
  const s = await db.submission.findUnique({ where: { hackathonId_userId: { hackathonId: id, userId: a.id } } });
  return { submission: s ? pub(s) : null };
});

// Create or update my submission. A new submission gets an anonymous project ID for blind judging.
export const PUT = handle(async (req, ctx) => {
  const a = await requireAuth(req, ["PARTICIPANT"]);
  const { id } = await ctx.params;
  const d = await body(req, schema);
  const reg = await db.registration.findUnique({ where: { userId_hackathonId: { userId: a.id, hackathonId: id } } });
  if (!reg) throw new HttpError(403, "Register for this hackathon before submitting", "NOT_REGISTERED");
  const existing = await db.submission.findUnique({ where: { hackathonId_userId: { hackathonId: id, userId: a.id } } });
  if (existing) return { submission: pub(await db.submission.update({ where: { id: existing.id }, data: d })) };
  for (let i = 0; i < 5; i++) {
    const projectCode = `NX-${randomInt(1000, 10000)}`;
    try {
      const s = await db.submission.create({ data: { ...d, projectCode, hackathonId: id, userId: a.id } });
      return { submission: pub(s) };
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e; // retry only on projectCode collision
    }
  }
  throw new HttpError(500, "Could not allocate a project ID");
});
