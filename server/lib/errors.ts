export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "EMAIL_NOT_VERIFIED"
  | "ONBOARDING_INCOMPLETE"
  | "REGISTRATION_CLOSED"
  | "REGISTRATION_FULL"
  | "TEAM_FULL"
  | "TEAM_LOCKED"
  | "ALREADY_IN_TEAM"
  | "SUBMISSION_LOCKED"
  | "JUDGING_LOCKED"
  | "INVALID_STATE"
  | "UPLOAD_REJECTED"
  | "BAD_REQUEST"
  | "INTERNAL";

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static unauthenticated(message = "Unauthenticated") {
    return new AppError("UNAUTHENTICATED", message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(message = "Resource not found") {
    return new AppError("NOT_FOUND", message, 404);
  }

  static validationFailed(message = "Validation failed", details?: unknown) {
    return new AppError("VALIDATION_FAILED", message, 400, details);
  }

  static conflict(message = "Conflict", code: ErrorCode = "CONFLICT") {
    return new AppError(code, message, 409);
  }

  static rateLimited(message = "Too many requests") {
    return new AppError("RATE_LIMITED", message, 429);
  }

  static businessRule(code: ErrorCode, message: string) {
    return new AppError(code, message, 422);
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new AppError("BAD_REQUEST", message, 400, details);
  }

  static internal(message = "Internal server error") {
    return new AppError("INTERNAL", message, 500);
  }
}
