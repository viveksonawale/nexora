import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AnnouncementService } from "@/server/modules/announcement/announcement.service";
import { CreateAnnouncementSchema } from "@/server/modules/announcement/announcement.schemas";

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const data = CreateAnnouncementSchema.parse(body);
  const result = await AnnouncementService.create(ctx.user!!, id, data);
  return NextResponse.json(result, { status: 201 });
});

export const GET = withApi({ auth: "public" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const result = await AnnouncementService.list(ctx.user! || null, id);
  return NextResponse.json(result);
});