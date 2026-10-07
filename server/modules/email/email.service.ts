import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Prisma } from "@prisma/client";
import { db } from "@/server/lib/db";
import { env } from "@/server/lib/env";
import { logger } from "@/server/lib/logger";

let transporter: Transporter | null = null;

function getMailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface QueueEmailInput {
  toEmail: string;
  template: "verify_email" | "reset_password" | "invite" | "notification";
  payload: Record<string, unknown>;
}

export async function queueEmail(input: QueueEmailInput): Promise<void> {
  await db.emailOutbox.create({
    data: {
      toEmail: input.toEmail,
      template: input.template,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });
}

export async function processOutboxBatch(batchSize = 20): Promise<{ processed: number; success: number; failed: number }> {
  const pendingEmails = await db.emailOutbox.findMany({
    where: {
      status: "PENDING",
      nextAttemptAt: { lte: new Date() },
    },
    take: batchSize,
    orderBy: { createdAt: "asc" },
  });

  let successCount = 0;
  let failedCount = 0;

  for (const item of pendingEmails) {
    try {
      if (env.NODE_ENV !== "test" && env.SMTP_HOST !== "localhost") {
        const mail = getMailTransporter();
        const payload = (item.payload || {}) as Record<string, unknown>;
        
        let subject = "Notification from Nexora";
        let text = `Hello,\n\nNotification from Nexora: ${JSON.stringify(payload)}`;

        if (item.template === "verify_email") {
          subject = "Verify your email - Nexora";
          text = `Welcome to Nexora!\n\nPlease verify your email by clicking the link below:\n${payload.url || `${env.APP_URL}/verify-email?token=${payload.token}`}`;
        } else if (item.template === "reset_password") {
          subject = "Reset your password - Nexora";
          text = `A password reset was requested for your Nexora account.\n\nReset your password using the link below:\n${payload.url || `${env.APP_URL}/reset-password?token=${payload.token}`}\n\nIf you did not request this, please ignore this email.`;
        }

        await mail.sendMail({
          from: env.EMAIL_FROM,
          to: item.toEmail,
          subject,
          text,
        });
      }

      await db.emailOutbox.update({
        where: { id: item.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
      successCount++;
    } catch (err: unknown) {
      failedCount++;
      const nextAttemptMinutes = Math.min(60, Math.pow(2, item.attempts + 1) * 2);
      const nextAttemptAt = new Date(Date.now() + nextAttemptMinutes * 60 * 1000);
      const errorMessage = err instanceof Error ? err.message : String(err);

      logger.error({ err, outboxId: item.id }, "Failed to send email from outbox");

      await db.emailOutbox.update({
        where: { id: item.id },
        data: {
          attempts: { increment: 1 },
          lastError: errorMessage,
          status: item.attempts >= 5 ? "FAILED" : "PENDING",
          nextAttemptAt,
        },
      });
    }
  }

  return { processed: pendingEmails.length, success: successCount, failed: failedCount };
}
