import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { db } from "@/server/lib/db";
import { AppError } from "@/server/lib/errors";

export const POST = withApi({ auth: "user" }, async (_req, ctx) => {
  const rawId = ctx.params?.id;
  const notificationId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!notificationId) {
    throw AppError.badRequest("Notification ID is required.");
  }

  const notif = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notif || notif.userId !== ctx.user!.id) {
    throw AppError.notFound("Notification not found.");
  }

  const updated = await db.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true, notification: updated });
});
