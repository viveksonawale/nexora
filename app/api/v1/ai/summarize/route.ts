import { z } from "zod";
import { requireAuth } from "@/lib/server/auth";
import { body, handle, HttpError } from "@/lib/server/http";

const schema = z.object({ text: z.string().trim().min(40).max(12000) });

// Problem statement summary: concise summary plus key points.
export const POST = handle(async (req) => {
  await requireAuth(req);
  const { text } = await body(req, schema);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(501, "AI summaries are not configured on this server", "AI_NOT_CONFIGURED");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "claude-sonnet-5-5",
      max_tokens: 600,
      system: 'Summarize hackathon problem statements. Reply with ONLY JSON: {"summary": string (max 2 sentences), "keyPoints": string[] (3 to 5 short items)}.',
      messages: [{ role: "user", content: text }],
    }),
  });
  if (!res.ok) throw new HttpError(502, "The AI service is unavailable right now", "AI_UPSTREAM");
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const raw = data.content.map((c) => c.text ?? "").join("").replace(/```json|```/g, "").trim();
  try {
    const parsed = z.object({ summary: z.string(), keyPoints: z.array(z.string()) }).parse(JSON.parse(raw));
    return parsed;
  } catch {
    throw new HttpError(502, "The AI returned an unreadable answer. Try again.", "AI_BAD_OUTPUT");
  }
});
