import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { body, handle, HttpError } from "@/lib/server/http";
import { issueOtp } from "@/lib/server/otp";
import { signToken } from "@/lib/server/auth";
import { publicUser } from "@/lib/server/serialize";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export const POST = handle(async (req) => {
  const { email, password } = await body(req, schema);
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Incorrect email or password", "BAD_CREDENTIALS");
  }
  if (!user.emailVerified) {
    await issueOtp(user.id, user.email, "VERIFY");
    throw new HttpError(403, "Verify your email to continue", "NOT_VERIFIED");
  }
  return { token: await signToken({ id: user.id, role: user.role }), user: publicUser(user) };
});
