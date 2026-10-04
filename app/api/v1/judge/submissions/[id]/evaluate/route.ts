import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { body, handle, HttpError } from "@/lib/server/http";

const schema = z.object({ score: z.number().int().min(0).max(100), comments: z.string().default("") });

export const POST = handle(async (req, ctx) => {
  const a = await requireAuth(req, ["JUDGE"]);
  const { id } = await ctx.params;
  const d = await body(req, schema);
  const sub = await db.submission.findUnique({ where: { id }, select: { hackathonId: true } });
  const assigned = sub && (await db.judgeAssignment.findUnique({ where: { hackathonId_judgeId: { hackathonId: sub.hackathonId, judgeId: a.id } } }));
  if (!assigned) throw new HttpError(404, "Submission not found", "NOT_FOUND");
  await db.evaluation.upsert({
    where: { submissionId_judgeId: { submissionId: id, judgeId: a.id } },
    create: { submissionId: id, judgeId: a.id, ...d },
    update: d,
  });
  return { ok: true };
});
