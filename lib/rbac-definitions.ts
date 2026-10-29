export interface PermissionDefinition {
  code: string;
  name: string;
  category: "PLATFORM" | "HACKATHON" | "JUDGING" | "REGISTRATION" | "SUBMISSION" | "COMMUNICATION" | "FINANCE" | "AUDIT";
  description: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Platform Permissions
  { code: "platform.admin", name: "Platform Administration", category: "PLATFORM", description: "Full super administrator access to all platform resources" },
  { code: "platform.support", name: "Platform Support", category: "PLATFORM", description: "Access support tools, view user records and assist troubleshooting" },
  { code: "platform.users.manage", name: "Manage Platform Users", category: "PLATFORM", description: "Modify user platform roles, suspend and reactivate accounts" },
  { code: "platform.roles.manage", name: "Manage Roles & Permissions", category: "PLATFORM", description: "Assign and revoke platform-wide and event roles" },
  
  // Hackathon Lifecycle & Core
  { code: "hackathon.create", name: "Create Hackathon", category: "HACKATHON", description: "Create new hackathon events under an organization" },
  { code: "hackathon.read", name: "View Hackathon Details", category: "HACKATHON", description: "View internal hackathon details, overview and metrics" },
  { code: "hackathon.update", name: "Update Hackathon Settings", category: "HACKATHON", description: "Edit event settings, dates, tracks, rules, and FAQs" },
  { code: "hackathon.publish", name: "Publish Hackathon", category: "HACKATHON", description: "Publish, pause, or change event visibility" },
  { code: "hackathon.archive", name: "Archive Hackathon", category: "HACKATHON", description: "Archive or close completed hackathons" },
  { code: "hackathon.delete", name: "Delete Hackathon", category: "HACKATHON", description: "Permanently delete an event (Super Admin / Owner only)" },
  { code: "hackathon.staff.manage", name: "Manage Staff & Roles", category: "HACKATHON", description: "Assign, invite, and revoke event staff roles" },

  // Registrations & Operations
  { code: "registration.view", name: "View Registrations", category: "REGISTRATION", description: "Search, filter, and inspect participant registrations" },
  { code: "registration.review", name: "Review Registrations", category: "REGISTRATION", description: "Approve, reject, or waitlist participant applications" },
  { code: "registration.checkin", name: "Check-in Participants", category: "REGISTRATION", description: "Scan QR codes and record event-day attendance" },
  { code: "registration.export", name: "Export Registration Data", category: "REGISTRATION", description: "Export participant and attendee lists" },

  // Teams & Submissions
  { code: "team.manage", name: "Manage Teams", category: "SUBMISSION", description: "Inspect team membership, change leader, or manage rosters" },
  { code: "submission.view", name: "View Project Submissions", category: "SUBMISSION", description: "View submitted project repositories, links, and documents" },
  { code: "submission.review", name: "Review Project Eligibility", category: "SUBMISSION", description: "Perform compliance checks and flag rule violations" },
  { code: "submission.manage", name: "Manage Submissions", category: "SUBMISSION", description: "Disqualify, reinstate, or edit project metadata" },

  // Judging & Evaluation
  { code: "judging.assign", name: "Assign Judges", category: "JUDGING", description: "Distribute submissions across judges manually or automatically" },
  { code: "judging.rubric.manage", name: "Manage Scoring Rubrics", category: "JUDGING", description: "Configure judging criteria, score ranges, and weights" },
  { code: "judging.evaluate", name: "Evaluate Assigned Projects", category: "JUDGING", description: "Submit scores, ratings, and feedback for assigned projects" },
  { code: "judging.aggregate.view", name: "View Aggregate Scores", category: "JUDGING", description: "Inspect leaderboards, average scores, and judge progress" },
  { code: "judging.lock", name: "Lock / Finalize Judging", category: "JUDGING", description: "Freeze score adjustments and finalize evaluations" },
  { code: "results.publish", name: "Publish Results", category: "JUDGING", description: "Approve and publish winners, awards, and certificates" },

  // Mentorship & Sponsors
  { code: "mentor.sessions.manage", name: "Manage Mentoring Sessions", category: "COMMUNICATION", description: "Host mentorship sessions and submit guidance feedback" },
  { code: "sponsor.metrics.view", name: "View Sponsor Metrics", category: "COMMUNICATION", description: "Access sponsored track submissions and engagement metrics" },

  // Communications & Prizes
  { code: "announcement.send", name: "Broadcast Announcements", category: "COMMUNICATION", description: "Send announcements to participants, judges, or all attendees" },
  { code: "prize.manage", name: "Manage Prizes & Finance", category: "FINANCE", description: "Configure prize tiers, payouts, and sponsor awards" },
  { code: "audit.view", name: "View Audit Logs", category: "AUDIT", description: "Access historical activity logs, security trails, and compliance reports" },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: SYSTEM_PERMISSIONS.map((p) => p.code),
  
  SUPPORT_ADMIN: [
    "platform.support",
    "hackathon.read",
    "registration.view",
    "submission.view",
    "audit.view",
  ],

  ORGANIZER: [
    "hackathon.read",
    "hackathon.update",
    "hackathon.publish",
    "hackathon.archive",
    "hackathon.staff.manage",
    "registration.view",
    "registration.review",
    "registration.checkin",
    "registration.export",
    "team.manage",
    "submission.view",
    "submission.review",
    "submission.manage",
    "judging.assign",
    "judging.rubric.manage",
    "judging.aggregate.view",
    "judging.lock",
    "results.publish",
    "mentor.sessions.manage",
    "sponsor.metrics.view",
    "announcement.send",
    "prize.manage",
    "audit.view",
  ],

  CO_ORGANIZER: [
    "hackathon.read",
    "hackathon.update",
    "registration.view",
    "registration.review",
    "registration.checkin",
    "registration.export",
    "team.manage",
    "submission.view",
    "submission.review",
    "judging.aggregate.view",
    "announcement.send",
    "audit.view",
  ],

  REGISTRATION_MANAGER: [
    "hackathon.read",
    "registration.view",
    "registration.review",
    "registration.checkin",
    "registration.export",
    "announcement.send",
  ],

  EVENT_OPS: [
    "hackathon.read",
    "registration.view",
    "registration.checkin",
  ],

  JUDGE: [
    "hackathon.read",
    "judging.evaluate",
  ],

  HEAD_JUDGE: [
    "hackathon.read",
    "judging.assign",
    "judging.rubric.manage",
    "judging.evaluate",
    "judging.aggregate.view",
    "judging.lock",
  ],

  SUBMISSION_REVIEWER: [
    "hackathon.read",
    "submission.view",
    "submission.review",
  ],

  MENTOR: [
    "hackathon.read",
    "mentor.sessions.manage",
  ],

  VOLUNTEER: [
    "hackathon.read",
    "registration.checkin",
  ],

  SPONSOR_REP: [
    "hackathon.read",
    "sponsor.metrics.view",
  ],

  PRIZE_MANAGER: [
    "hackathon.read",
    "prize.manage",
    "results.publish",
  ],

  COMMUNICATIONS_MANAGER: [
    "hackathon.read",
    "announcement.send",
  ],

  AUDITOR: [
    "hackathon.read",
    "registration.view",
    "submission.view",
    "judging.aggregate.view",
    "audit.view",
  ],
};
