import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { body, handle, HttpError } from "@/lib/server/http";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export const POST = handle(async (req, ctx) => {
  const a = await requireAuth(req, ["ORGANIZER"]);
  const { id } = await ctx.params;
  const h = await db.hackathon.findUnique({ where: { id } });
  if (!h || h.organizerId !== a.id) throw new HttpError(404, "Hackathon not found", "NOT_FOUND");
  const { email } = await body(req, schema);
  const judge = await db.user.findUnique({ where: { email } });
  if (!judge || judge.role !== "JUDGE") {
    throw new HttpError(404, "No judge account with that email. They must sign up as a judge first.", "NOT_A_JUDGE");
  }
  await db.judgeAssignment.upsert({
    where: { hackathonId_judgeId: { hackathonId: id, judgeId: judge.id } },
    create: { hackathonId: id, judgeId: judge.id },
    update: {},
  });
  return { ok: true };
});
