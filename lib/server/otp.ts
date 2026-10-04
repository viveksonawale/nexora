import { createHash, randomInt } from "crypto";
import type { OtpPurpose } from "@prisma/client";
import { db } from "./db";
import { HttpError } from "./http";
import { sendOtpEmail } from "./mail";

const hash = (code: string) =>
  createHash("sha256").update(code + (process.env.AUTH_SECRET ?? "")).digest("hex");

export async function issueOtp(userId: string, email: string, purpose: OtpPurpose) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.otp.deleteMany({ where: { userId, purpose } });
  await db.otp.create({
    data: { userId, purpose, codeHash: hash(code), expiresAt: new Date(Date.now() + 10 * 60_000) },
  });
  await sendOtpEmail(email, code, purpose);
}

export async function consumeOtp(userId: string, purpose: OtpPurpose, code: string) {
  const otp = await db.otp.findFirst({ where: { userId, purpose }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.expiresAt < new Date()) throw new HttpError(400, "Code expired. Request a new one.", "OTP_EXPIRED");
  if (otp.attempts >= 5) throw new HttpError(429, "Too many attempts. Request a new code.", "OTP_LOCKED");
  if (otp.codeHash !== hash(code)) {
    await db.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, "Incorrect code", "OTP_INVALID");
  }
  await db.otp.delete({ where: { id: otp.id } });
}
