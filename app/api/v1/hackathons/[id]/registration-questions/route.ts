import { NextResponse } from "next/server";
import { withApi } from "@/server/lib/api";
import { HackathonService } from "@/server/modules/hackathon/hackathon.service";
import { RegistrationQuestionSchema } from "@/server/modules/hackathon/hackathon.schemas";

export const POST = withApi({ auth: "user" }, async (req, { params, user }) => {
  const { id } = params as Record<string, string>;
  const body = await req.json();
  const data = RegistrationQuestionSchema.parse(body);

  const result = await HackathonService.createQuestion(user!, id, data);
  return NextResponse.json(result, { status: 201 });
});
