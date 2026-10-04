import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { handle, HttpError } from "@/lib/server/http";
import { cardInclude, publicHackathon } from "@/lib/server/serialize";

export const GET = handle(async (req, ctx) => {
  const a = await requireAuth(req, ["ORGANIZER"]);
  const { id } = await ctx.params;
  const h = await db.hackathon.findUnique({ where: { id }, include: cardInclude });
  if (!h || h.organizerId !== a.id) throw new HttpError(404, "Hackathon not found", "NOT_FOUND");

  const [participants, submissionCount, judges, evaluated] = await Promise.all([
    db.registration.findMany({ where: { hackathonId: id }, orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { name: true, email: true, college: true } } } }),
    db.submission.count({ where: { hackathonId: id } }),
    db.judgeAssignment.findMany({ where: { hackathonId: id }, include: { judge: { select: { name: true, email: true } } } }),
    db.evaluation.count({ where: { submission: { hackathonId: id } } }),
  ]);

  // Organizers see submitters; judges never do. Results are the average score per project.
  const subs = await db.submission.findMany({
    where: { hackathonId: id },
    include: { user: { select: { name: true } }, evaluations: { select: { score: true } } },
  });
  const results = subs
    .map((s) => ({
      projectCode: s.projectCode, title: s.title, team: s.user.name, evaluations: s.evaluations.length,
      averageScore: s.evaluations.length ? Math.round((s.evaluations.reduce((t, e) => t + e.score, 0) / s.evaluations.length) * 10) / 10 : null,
    }))
    .sort((x, y) => (y.averageScore ?? -1) - (x.averageScore ?? -1));

  return {
    hackathon: publicHackathon(h),
    stats: { registrations: participants.length, submissions: submissionCount, judges: judges.length, evaluations: evaluated },
    timeline: [
      { label: "Created", at: h.createdAt.toISOString() },
      { label: "Starts", at: h.startDate.toISOString() },
      ...(h.endDate ? [{ label: "Ends", at: h.endDate.toISOString() }] : []),
    ],
    participants: participants.map((r) => ({ name: r.user.name, email: r.user.email, college: r.user.college, registeredAt: r.createdAt.toISOString() })),
    judges: judges.map((j) => ({ name: j.judge.name, email: j.judge.email })),
    results,
  };
});
