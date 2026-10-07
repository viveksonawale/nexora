import { SessionUser, PlatformRole, OrgRole, HackathonStaffRole } from './api-client';

export function hasPlatformRole(user: SessionUser | null, role: PlatformRole): boolean {
  if (!user) return false;
  if (user.platformRole === 'SUPER_ADMIN') return true;
  return user.platformRole === role;
}

export function hasOrgRole(user: SessionUser | null, organizationId: string, allowedRoles: OrgRole[]): boolean {
  if (!user) return false;
  if (user.platformRole === 'SUPER_ADMIN') return true; // Super admins can do everything
  
  const membership = user.orgMemberships?.find(m => m.organizationId === organizationId);
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
  
  const role = user.staffRoles?.find(r => r.hackathonId === hackathonId);
  if (!role) return false;
  
  return allowedRoles.includes(role.role);
}

export function isHackathonJudge(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['JUDGE']);
}

export function isHackathonVolunteer(user: SessionUser | null, hackathonId: string): boolean {
  return hasHackathonStaffRole(user, hackathonId, ['VOLUNTEER']);
}
