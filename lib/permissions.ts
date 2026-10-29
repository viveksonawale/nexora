import { SessionUser, PlatformRole, OrgRole, HackathonStaffRole } from './api-client';

export function hasPlatformRole(user: SessionUser | null, role: PlatformRole): boolean {
  if (!user) return false;
  if (user.platformRole === 'SUPER_ADMIN') return true;
  return user.platformRole === role;
}

export function isPlatformSuperAdmin(user: SessionUser | null): boolean {
  return user?.platformRole === 'SUPER_ADMIN';
}

export function isPlatformSupportAdmin(user: SessionUser | null): boolean {
  return user?.platformRole === 'SUPPORT_ADMIN' || user?.platformRole === 'SUPER_ADMIN';
}

export function hasOrgRole(user: SessionUser | null, organizationId: string, allowedRoles: OrgRole[]): boolean {
  if (!user) return false;
  if (user.platformRole === 'SUPER_ADMIN') return true;
  if (user.onboardingStatus && user.onboardingStatus !== 'VERIFIED') return false;
  
  const membership = user.orgMemberships?.find(
    m => m.organizationId === organizationId || m.organizationSlug === organizationId || (m as any).orgId === organizationId
  );
  if (!membership) return false;
  
  return allowedRoles.includes(membership.role);
}

export function isOrgOwner(user: SessionUser | null, organizationId: string): boolean {
  return hasOrgRole(user, organizationId, ['OWNER']);
}

export function isOrgAdmin(user: SessionUser | null, organizationId: string): boolean {
  return hasOrgRole(user, organizationId, ['OWNER', 'ADMIN']);
}

export function isOrgStaff(user: SessionUser | null, organizationId: string): boolean {
  return hasOrgRole(user, organizationId, ['OWNER', 'ADMIN', 'STAFF']);
}

export function hasHackathonStaffRole(user: SessionUser | null, hackathonId: string, allowedRoles: HackathonStaffRole[]): boolean {
  if (!user) return false;
  if (user.platformRole === 'SUPER_ADMIN') return true;
  if (user.onboardingStatus && user.onboardingStatus !== 'VERIFIED') return false;
  
  const role = user.staffRoles?.find(
    r => r.hackathonId === hackathonId || r.hackathonSlug === hackathonId
  );
  if (!role) return false;
  
  return allowedRoles.includes(role.role);
}

export function isHackathonOrganizer(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['ORGANIZER']);
}

export function isHackathonCoOrganizer(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['ORGANIZER', 'CO_ORGANIZER']);
}

export function isHackathonJudge(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['JUDGE', 'HEAD_JUDGE']);
}

export function isHeadJudge(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['HEAD_JUDGE']);
}

export function isRegistrationManager(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['ORGANIZER', 'CO_ORGANIZER', 'REGISTRATION_MANAGER']);
}

export function isEventOps(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['ORGANIZER', 'EVENT_OPS', 'VOLUNTEER']);
}

export function isSubmissionReviewer(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['ORGANIZER', 'CO_ORGANIZER', 'SUBMISSION_REVIEWER']);
}

export function isHackathonMentor(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['MENTOR']);
}

export function isHackathonVolunteer(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['VOLUNTEER', 'EVENT_OPS']);
}

export function isSponsorRep(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['SPONSOR_REP']);
}

export function isPrizeManager(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['ORGANIZER', 'PRIZE_MANAGER']);
}

export function isCommunicationsManager(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['ORGANIZER', 'CO_ORGANIZER', 'COMMUNICATIONS_MANAGER']);
}

export function isAuditor(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['ORGANIZER', 'AUDITOR']);
}
