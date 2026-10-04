import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";

export const GET = handle(async (req) => {
  const a = await requireAuth(req, ["JUDGE"]);
  const rows = await db.evaluation.findMany({
    where: { judgeId: a.id },
    orderBy: { createdAt: "desc" },
    select: { score: true, comments: true, createdAt: true, submission: { select: { id: true, projectCode: true, title: true, hackathon: { select: { name: true } } } } },
  });
  return {
    items: rows.map((r) => ({
      score: r.score, comments: r.comments, createdAt: r.createdAt.toISOString(),
      submissionId: r.submission.id, projectCode: r.submission.projectCode,
      title: r.submission.title, hackathonName: r.submission.hackathon.name,
    })),
  };
});
