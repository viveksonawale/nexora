import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { RegistrationService } from "@/server/modules/registration/registration.service";
import { CreateRegistrationSchema, QueryRegistrationSchema } from "@/server/modules/registration/registration.schemas";

export const POST = withApi({ auth: "verified" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = CreateRegistrationSchema.parse(body);

  const reg = await RegistrationService.register(user!, id, data);
  return NextResponse.json(reg, { status: 201 });
});

export const GET = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const { searchParams } = new URL(req.url);
  const query = QueryRegistrationSchema.parse(Object.fromEntries(searchParams));

  const regs = await RegistrationService.getRegistrations(user!, id, query);
  return NextResponse.json(regs);
});
