import { z } from "zod";
import { db } from "@/lib/server/db";
import { body, handle } from "@/lib/server/http";
import { issueOtp } from "@/lib/server/otp";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export const POST = handle(async (req) => {
  const { email } = await body(req, schema);
  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) await issueOtp(user.id, user.email, "VERIFY");
  return { ok: true };
});
