import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

type Ctx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: Ctx) => Promise<Response | object>;

/** Wraps a route handler: JSON in/out, uniform errors { error, code }. */
export function handle(fn: Handler) {
  return async (req: Request, ctx: Ctx) => {
    try {
      const out = await fn(req, ctx);
      return out instanceof Response ? out : NextResponse.json(out);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
      }
      if (e instanceof ZodError) {
        const msg = e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        return NextResponse.json({ error: msg, code: "VALIDATION" }, { status: 400 });
      }
      console.error("[api]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request, schema: { parse: (v: unknown) => T }): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body", "VALIDATION");
  }
  return schema.parse(raw);
}
