import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/auth";
import { body, handle, HttpError } from "@/lib/server/http";
import { publicUser } from "@/lib/server/serialize";

export const GET = handle(async (req) => {
  const a = await requireAuth(req);
  const user = await db.user.findUnique({ where: { id: a.id } });
  if (!user) throw new HttpError(401, "Account no longer exists", "UNAUTHENTICATED");
  return { user: publicUser(user) };
});

const patch = z.object({ name: z.string().trim().min(2).optional(), college: z.string().trim().optional() });

export const PATCH = handle(async (req) => {
  const a = await requireAuth(req);
  const data = await body(req, patch);
  return { user: publicUser(await db.user.update({ where: { id: a.id }, data })) };
});
