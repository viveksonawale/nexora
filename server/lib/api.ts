import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { logger } from "./logger";
import { checkRateLimit } from "./ratelimit";
import { verifyAccessToken } from "@/server/modules/auth/tokens";
import { db } from "./db";
import { AuthUser, RequestAuthContext } from "@/server/policies/policy";

export type AuthRequirement = "public" | "user" | "verified" | "superAdmin";

export interface ApiHandlerOptions {
  auth?: AuthRequirement;
  rateLimitKey?: (req: NextRequest) => string;
}

export type ApiHandler = (
  req: NextRequest,
  ctx: RequestAuthContext & { params?: Record<string, string | string[]> }
) => Promise<NextResponse | void>;

export function withApi(
  optionsOrHandler: ApiHandlerOptions | ApiHandler,
  optionalHandler?: ApiHandler
) {
  const options: ApiHandlerOptions =
    typeof optionsOrHandler === "function" ? {} : optionsOrHandler;
  const handler: ApiHandler =
    typeof optionsOrHandler === "function" ? optionsOrHandler : optionalHandler!;

  return async (
    req: NextRequest,
    routeContext?: { params?: Promise<Record<string, string | string[]>> | Record<string, string | string[]> }
  ) => {
    const requestId = crypto.randomUUID();
    const startTime = performance.now();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;
    const isAuthRoute = req.nextUrl.pathname.includes("/auth");

    // 1. Resolve Auth user if token present
    let authUser: AuthUser | null = null;
    const cookieToken = req.cookies.get("access_token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : undefined;
    const token = cookieToken || bearerToken;

    if (token) {
      try {
        const payload = await verifyAccessToken(token);
        const dbUser = await db.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, platformRole: true, status: true, emailVerifiedAt: true },
        });

        if (dbUser) {
          authUser = {
            id: dbUser.id,
            email: dbUser.email,
            platformRole: dbUser.platformRole,
            status: dbUser.status,
            emailVerified: !!dbUser.emailVerifiedAt,
          };
        }
      } catch {
        // If auth was required and token is invalid, we will reject in step 3
      }
    }

    // 2. Rate Limiting
    const rateLimitIdentifier =
      options.rateLimitKey?.(req) ||
      (authUser ? `user:${authUser.id}` : `ip:${ip}`);

    const rateResult = await checkRateLimit(rateLimitIdentifier, isAuthRoute);
    if (!rateResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
            requestId,
          },
        },
        {
          status: 429,
          headers: {
            "X-Request-Id": requestId,
            "Retry-After": "60",
          },
        }
      );
    }

    // 3. Auth level enforcement
    const requiredAuth = options.auth || "public";

    if (requiredAuth !== "public") {
      if (!authUser) {
        return NextResponse.json(
          {
            error: {
              code: "UNAUTHENTICATED",
              message: "Authentication required",
              requestId,
            },
          },
          { status: 401, headers: { "X-Request-Id": requestId } }
        );
      }

      if (authUser.status === "SUSPENDED") {
        return NextResponse.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "Account suspended",
              requestId,
            },
          },
          { status: 403, headers: { "X-Request-Id": requestId } }
        );
      }

      if (requiredAuth === "verified" && !authUser.emailVerified) {
        return NextResponse.json(
          {
            error: {
              code: "EMAIL_NOT_VERIFIED",
              message: "Please verify your email address to proceed",
              requestId,
            },
          },
          { status: 403, headers: { "X-Request-Id": requestId } }
        );
      }

      if (requiredAuth === "superAdmin" && authUser.platformRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "Super admin permissions required",
              requestId,
            },
          },
          { status: 403, headers: { "X-Request-Id": requestId } }
        );
      }
    }

    // Await route params if Promise (Next.js 15 App Router)
    let resolvedParams: Record<string, string | string[]> | undefined = undefined;
    if (routeContext?.params) {
      resolvedParams = await Promise.resolve(routeContext.params);
    }

    const authContext: RequestAuthContext & { params?: Record<string, string | string[]> } = {
      user: authUser,
      requestId,
      ip,
      userAgent,
      params: resolvedParams,
    };

    try {
      const res = await handler(req, authContext);
      const response = res || new NextResponse(null, { status: 204 });

      response.headers.set("X-Request-Id", requestId);

      const duration = performance.now() - startTime;
      logger.info(
        {
          reqId: requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          status: response.status,
          userId: authUser?.id,
          duration: `${duration.toFixed(2)}ms`,
        },
        "Request finished"
      );

      return response;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        logger.warn(
          { reqId: requestId, code: error.code, message: error.message },
          "Application error"
        );
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
              requestId,
            },
          },
          { status: error.statusCode, headers: { "X-Request-Id": requestId } }
        );
      }

      if (error instanceof ZodError) {
        logger.warn(
          { reqId: requestId, issues: error.issues },
          "Validation error"
        );
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_FAILED",
              message: "Validation failed",
              details: error.flatten().fieldErrors,
              requestId,
            },
          },
          { status: 400, headers: { "X-Request-Id": requestId } }
        );
      }

      const errObj = error instanceof Error ? error : new Error(String(error));
      logger.error({ reqId: requestId, error: errObj.message, stack: errObj.stack }, "Unhandled server error");
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL",
            message: "Internal server error",
            requestId,
          },
        },
        { status: 500, headers: { "X-Request-Id": requestId } }
      );
    }
  };
}

export function jsonResponse(data: unknown, meta?: unknown, status = 200) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status });
}

export function emptyResponse(status = 204) {
  return new NextResponse(null, { status });
}
