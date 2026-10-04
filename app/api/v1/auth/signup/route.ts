import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { body, handle, HttpError } from "@/lib/server/http";
import { issueOtp } from "@/lib/server/otp";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  college: z.string().trim().default(""),
  role: z.enum(["PARTICIPANT", "ORGANIZER", "JUDGE"]).default("PARTICIPANT"),
});

export const POST = handle(async (req) => {
  const d = await body(req, schema);
  const existing = await db.user.findUnique({ where: { email: d.email } });
  if (existing?.emailVerified) throw new HttpError(409, "An account with this email already exists", "EMAIL_TAKEN");
  const passwordHash = await bcrypt.hash(d.password, 10);
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: { name: d.name, college: d.college, passwordHash, role: d.role } })
    : await db.user.create({ data: { name: d.name, email: d.email, college: d.college, passwordHash, role: d.role } });
  await issueOtp(user.id, user.email, "VERIFY");
  return { email: user.email, requiresOtp: true };
});
