import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";

class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  async limit(identifier: string) {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetAt) {
      this.store.set(identifier, { count: 1, resetAt: now + this.windowMs });
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: now + this.windowMs };
    }

    if (entry.count >= this.maxRequests) {
      return { success: false, limit: this.maxRequests, remaining: 0, reset: entry.resetAt };
    }

    entry.count += 1;
    return { success: true, limit: this.maxRequests, remaining: this.maxRequests - entry.count, reset: entry.resetAt };
  }
}

let authLimiter: { limit: (id: string) => Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> };
let apiLimiter: { limit: (id: string) => Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> };

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN && env.NODE_ENV !== "test") {
  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_AUTH_PER_MINUTE, "60 s"),
    analytics: true,
    prefix: "ratelimit:auth",
  });

  apiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_API_PER_MINUTE, "60 s"),
    analytics: true,
    prefix: "ratelimit:api",
  });
} else {
  authLimiter = new MemoryRateLimiter(env.RATE_LIMIT_AUTH_PER_MINUTE, 60);
  apiLimiter = new MemoryRateLimiter(env.RATE_LIMIT_API_PER_MINUTE, 60);
}

export async function checkRateLimit(identifier: string, isAuthRoute = false) {
  const limiter = isAuthRoute ? authLimiter : apiLimiter;
  return limiter.limit(identifier);
}
