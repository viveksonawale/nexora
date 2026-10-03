import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { AnnouncementService } from "@/server/modules/announcement/announcement.service";
import { UpdateAnnouncementSchema } from "@/server/modules/announcement/announcement.schemas";

export const PATCH = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = UpdateAnnouncementSchema.parse(body);
  const result = await AnnouncementService.update(user!, id, data);
  return NextResponse.json(result);
});

export const DELETE = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  await AnnouncementService.delete(user!, id);
  return new NextResponse(null, { status: 204 });
});