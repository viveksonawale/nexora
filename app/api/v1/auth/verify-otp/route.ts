import { z } from "zod";
import { db } from "@/lib/server/db";
import { body, handle, HttpError } from "@/lib/server/http";
import { consumeOtp } from "@/lib/server/otp";
import { signToken } from "@/lib/server/auth";
import { publicUser } from "@/lib/server/serialize";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().length(6) });

export const POST = handle(async (req) => {
  const { email, code } = await body(req, schema);
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(404, "Account not found", "NOT_FOUND");
  await consumeOtp(user.id, "VERIFY", code);
  const verified = await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  return { token: await signToken({ id: verified.id, role: verified.role }), user: publicUser(verified) };
});
