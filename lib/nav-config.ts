export interface NavItem {
  label: string;
  route: string;
  requiredPermission?: string;
}

export interface NavConfig {
  participant: NavItem[];
  participantHackathonTabs: NavItem[];
  organizer: NavItem[];
  organizerHackathon: NavItem[];
  judge: NavItem[];
  volunteer: NavItem[];
  admin: NavItem[];
}

export const NAV_CONFIG: NavConfig = {
  participant: [
    { label: 'Explore', route: '/explore' },
    { label: 'My Hackathons', route: '/my-hackathons' },
    { label: 'My Team', route: '/my-team' },
    { label: 'My Submission', route: '/my-submission' },
    { label: 'Certificates', route: '/certificates' },
    { label: 'Profile & Resume', route: '/profile' }
  ],
  participantHackathonTabs: [
    { label: 'Overview', route: 'overview' },
    { label: 'Schedule', route: 'schedule' },
    { label: 'Prizes & Tracks', route: 'prizes' },
    { label: 'Teams', route: 'teams' },
    { label: 'Announcements', route: 'announcements' },
    { label: 'My QR', route: 'qr' },
    { label: 'Submission', route: 'submission' }
  ],
  organizer: [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Hackathons', route: '/dashboard/hackathons' },
    { label: 'Members & Roles', route: '/dashboard/members', requiredPermission: 'ADMIN' },
    { label: 'Organization Settings', route: '/dashboard/settings', requiredPermission: 'ADMIN' }
  ],
  organizerHackathon: [
    { label: '< Back to hackathons', route: '/dashboard/hackathons' },
    { label: 'Overview', route: 'overview' },
    { label: 'Setup', route: 'setup', requiredPermission: 'ADMIN' },
    { label: 'Registrations', route: 'registrations' },
    { label: 'Teams', route: 'teams' },
    { label: 'Submissions', route: 'submissions' },
    { label: 'Judging', route: 'judging', requiredPermission: 'ADMIN' },
    { label: 'Check-in', route: 'check-in' },
    { label: 'Announcements', route: 'announcements' },
    { label: 'Results & Certificates', route: 'results', requiredPermission: 'ADMIN' },
    { label: 'Audit log', route: 'audit', requiredPermission: 'ADMIN' }
  ],
  judge: [
    { label: 'My Events', route: '/judge/events' },
    { label: 'Assigned Submissions', route: '/judge/assignments' },
    { label: 'Guidelines', route: '/judge/guidelines' }
  ],
  volunteer: [
    { label: 'Check-in', route: '/volunteer/check-in' }
  ],
  admin: [
    { label: 'Dashboard', route: '/admin' },
    { label: 'Organizations', route: '/admin/organizations' },
    { label: 'Users', route: '/admin/users' },
    { label: 'Skills', route: '/admin/skills' },
    { label: 'Audit Log', route: '/admin/audit' }
  ]
};
