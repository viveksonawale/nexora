import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";

// BLIND: no submitter fields are ever selected here.
export const GET = handle(async (req) => {
  const a = await requireAuth(req, ["JUDGE"]);
  const assignments = await db.judgeAssignment.findMany({ where: { judgeId: a.id }, select: { hackathonId: true } });
  const subs = await db.submission.findMany({
    where: { hackathonId: { in: assignments.map((x) => x.hackathonId) } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, projectCode: true, title: true, description: true, repoUrl: true, demoUrl: true,
      hackathon: { select: { id: true, name: true } },
      evaluations: { where: { judgeId: a.id }, select: { score: true, comments: true } },
    },
  });
  return {
    items: subs.map(({ evaluations, ...s }) => ({ ...s, myEvaluation: evaluations[0] ?? null })),
  };
});
