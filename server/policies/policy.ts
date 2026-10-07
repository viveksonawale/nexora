import { PlatformRole, OrgRole, HackathonStaffRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  platformRole: PlatformRole;
  emailVerified: boolean;
  status: "ACTIVE" | "SUSPENDED";
}

export interface RequestAuthContext {
  user: AuthUser | null;
  requestId: string;
  ip: string;
  userAgent?: string;
}

export type PolicyAction =
  | "org:create"
  | "org:read"
  | "org:update"
  | "org:delete"
  | "org:manage_members"
  | "hackathon:create"
  | "hackathon:read"
  | "hackathon:update"
  | "hackathon:delete"
  | "hackathon:publish"
  | "hackathon:manage_staff"
  | "hackathon:score"
  | "submission:submit"
  | "submission:view_blind"
  | "admin:access";

export function can(
  user: AuthUser | null,
  action: PolicyAction,
  resourceContext?: {
    orgRole?: OrgRole | null;
    staffRole?: HackathonStaffRole | null;
    isOwner?: boolean;
  }
): boolean {
  if (!user || user.status === "SUSPENDED") {
    return false;
  }

  // Super admin can do everything
  if (user.platformRole === "SUPER_ADMIN") {
    return true;
  }

  switch (action) {
    case "admin:access":
      return false;

    case "org:create":
      return user.emailVerified;

    case "org:update":
    case "org:delete":
    case "hackathon:create":
    case "hackathon:publish":
      return resourceContext?.orgRole === "OWNER" || resourceContext?.orgRole === "ADMIN";

    case "org:manage_members":
    case "hackathon:update":
    case "hackathon:manage_staff":
      return resourceContext?.orgRole === "OWNER" || resourceContext?.orgRole === "ADMIN";

    case "org:read":
    case "hackathon:read":
      return (
        resourceContext?.orgRole === "OWNER" ||
        resourceContext?.orgRole === "ADMIN" ||
        resourceContext?.orgRole === "STAFF"
      );

    case "hackathon:score":
      return resourceContext?.staffRole === "JUDGE";

    case "submission:submit":
      return !!resourceContext?.isOwner;

    default:
      return false;
  }
}
