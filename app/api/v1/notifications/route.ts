import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { db } from "@/server/lib/db";

export const GET = withApi({ auth: "user" }, async (_req, ctx) => {
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: ctx.user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({
      where: { userId: ctx.user!.id, readAt: null },
    }),
  ]);

  return NextResponse.json({
    notifications,
    unreadCount,
  });
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  // Mark all notifications as read
  await db.notification.updateMany({
    where: { userId: ctx.user!.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true, message: "All notifications marked as read." });
});
