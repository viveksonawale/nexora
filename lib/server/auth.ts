import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { HttpError } from "./http";

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
};

export type AuthUser = { id: string; role: Role };

export async function signToken(u: AuthUser) {
  return new SignJWT({ role: u.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

/** Returns the caller from `Authorization: Bearer <token>`, or null. */
export async function getAuth(req: Request): Promise<AuthUser | null> {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(h.slice(7), secret());
    return { id: String(payload.sub), role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, roles?: Role[]): Promise<AuthUser> {
  const u = await getAuth(req);
  if (!u) throw new HttpError(401, "Sign in required", "UNAUTHENTICATED");
  if (roles && !roles.includes(u.role)) throw new HttpError(403, "Not allowed for your role", "FORBIDDEN");
  return u;
}
