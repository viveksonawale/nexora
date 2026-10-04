import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { body, handle, HttpError } from "@/lib/server/http";
import { consumeOtp } from "@/lib/server/otp";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6),
  password: z.string().min(8),
});

export const POST = handle(async (req) => {
  const { email, code, password } = await body(req, schema);
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(400, "Incorrect code", "OTP_INVALID");
  await consumeOtp(user.id, "RESET", code);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return { ok: true };
});
