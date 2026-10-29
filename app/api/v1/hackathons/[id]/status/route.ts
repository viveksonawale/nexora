import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { HackathonStatus } from "@prisma/client";
import { z } from "zod";

const TransitionStateSchema = z.object({
  status: z.nativeEnum(HackathonStatus),
  notes: z.string().optional(),
});

export const POST = withApi({ auth: "user" }, async (req, ctx) => {
  const id = ctx.params?.id as string;
  const body = await req.json();
  const { status, notes } = TransitionStateSchema.parse(body);

  const hackathon = await HackathonService.transitionState(ctx.user!, id, status, notes);
  return NextResponse.json(hackathon);
});
