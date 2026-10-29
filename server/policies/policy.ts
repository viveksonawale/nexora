import { PlatformRole, OrgRole, HackathonStaffRole, OnboardingStatus } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  platformRole: PlatformRole;
  emailVerified: boolean;
  status: "ACTIVE" | "SUSPENDED";
  onboardingStatus?: OnboardingStatus;
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
  | "hackathon:archive"
  | "hackathon:manage_staff"
  | "hackathon:score"
  | "submission:submit"
  | "submission:view_blind"
  | "submission:review"
  | "registration:review"
  | "registration:checkin"
  | "judging:aggregate"
  | "prize:manage"
  | "announcement:send"
  | "audit:view"
  | "admin:access"
  | "admin:support";

export function can(
  user: AuthUser | null,
  action: PolicyAction,
  resourceContext?: {
    orgRole?: OrgRole | null;
    staffRole?: HackathonStaffRole | null;
    staffRoles?: HackathonStaffRole[] | null;
    isOwner?: boolean;
    hackathonRole?: HackathonStaffRole | null;
  }
): boolean {
  if (!user || user.status === "SUSPENDED") {
    return false;
  }

  // Super admin can do everything across the entire platform
  if (user.platformRole === "SUPER_ADMIN") {
    return true;
  }

  // Users whose onboarding verification is pending or rejected cannot perform organizer actions
  if (
    user.onboardingStatus &&
    user.onboardingStatus !== "VERIFIED" &&
    action !== "submission:submit" &&
    action !== "hackathon:read"
  ) {
    return false;
  }

  const staffRole = resourceContext?.staffRole || resourceContext?.hackathonRole;
  const staffRoles = resourceContext?.staffRoles || (staffRole ? [staffRole] : []);
  const orgRole = resourceContext?.orgRole;

  const isOrgAdminOrOwner = orgRole === "OWNER" || orgRole === "ADMIN";
  const isOrganizer = isOrgAdminOrOwner || staffRoles.includes("ORGANIZER");
  const isCoOrganizer = isOrganizer || staffRoles.includes("CO_ORGANIZER");

  switch (action) {
    case "admin:access":
      return false;

    case "admin:support":
      return user.platformRole === "SUPPORT_ADMIN";

    case "org:create":
      return user.emailVerified;

    case "org:update":
    case "org:delete":
    case "org:manage_members":
      return isOrgAdminOrOwner;

    case "org:read":
      return (
        orgRole === "OWNER" ||
        orgRole === "ADMIN" ||
        orgRole === "STAFF" ||
        user.platformRole === "SUPPORT_ADMIN"
      );

    case "hackathon:create":
      return isOrgAdminOrOwner;

    case "hackathon:delete":
      return orgRole === "OWNER";

    case "hackathon:publish":
    case "hackathon:archive":
    case "hackathon:manage_staff":
      return isOrganizer;

    case "hackathon:update":
      return isCoOrganizer;

    case "hackathon:read":
      return (
        orgRole === "OWNER" ||
        orgRole === "ADMIN" ||
        orgRole === "STAFF" ||
        staffRoles.length > 0 ||
        user.platformRole === "SUPPORT_ADMIN"
      );

    case "hackathon:score":
      return staffRoles.includes("JUDGE") || staffRoles.includes("HEAD_JUDGE");

    case "judging:aggregate":
      return isCoOrganizer || staffRoles.includes("HEAD_JUDGE") || staffRoles.includes("AUDITOR");

    case "submission:review":
      return isCoOrganizer || staffRoles.includes("SUBMISSION_REVIEWER");

    case "submission:submit":
      return !!resourceContext?.isOwner;

    case "registration:review":
      return isCoOrganizer || staffRoles.includes("REGISTRATION_MANAGER");

    case "registration:checkin":
      return (
        isCoOrganizer ||
        staffRoles.includes("REGISTRATION_MANAGER") ||
        staffRoles.includes("EVENT_OPS") ||
        staffRoles.includes("VOLUNTEER")
      );

    case "prize:manage":
      return isOrganizer || staffRoles.includes("PRIZE_MANAGER");

    case "announcement:send":
      return isCoOrganizer || staffRoles.includes("COMMUNICATIONS_MANAGER");

    case "audit:view":
      return (
        isOrganizer ||
        staffRoles.includes("AUDITOR") ||
        user.platformRole === "SUPPORT_ADMIN"
      );

    default:
      return false;
  }
}
