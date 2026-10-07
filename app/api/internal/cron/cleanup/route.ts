import { NextResponse } from "next/server";
import { db } from "@/server/lib/db";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";

export const GET = async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
  const providedSecret = bearerSecret || cronHeader;

  if (providedSecret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Invalid cron secret" }, { status: 403 });
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // 1. Delete pending uploads older than 24h
    const deletedUploads = await db.fileAsset.deleteMany({
      where: {
        status: "PENDING",
        createdAt: { lt: twentyFourHoursAgo },
      },
    });

    // 2. Delete expired email tokens
    const deletedTokens = await db.emailToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    // 3. Mark expired team invites as EXPIRED (if not already)
    const expiredInvites = await db.teamInvite.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: {
        status: "EXPIRED",
      },
    });

    return NextResponse.json({
      success: true,
      deletedUploads: deletedUploads.count,
      deletedTokens: deletedTokens.count,
      expiredInvites: expiredInvites.count,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
