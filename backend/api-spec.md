# Nexora API Spec (v1)

Base path: `/api/v1`. JSON only. Auth via httpOnly cookies (or `Authorization: Bearer <access>` for non-browser clients).

## Conventions

- Success: `{ "data": <payload>, "meta": { "nextCursor": "..." } }` (meta only on lists)
- Error: `{ "error": { "code", "message", "details?", "requestId" } }`
- Lists: `?limit=` (default 20, max 50) and `?cursor=`
- IDs are cuid strings. Dates are ISO 8601 UTC.
- `:hid` = hackathon id or slug. `:oid` = organization id.
- Auth column: `Public`, `User` (logged in), `Verified` (logged in + verified email), `OrgStaff`, `OrgAdmin`, `Judge`, `SuperAdmin`. Org roles are checked against the resource's organization.
- Status codes: 200, 201, 204, 400 (validation), 401, 403, 404, 409 (conflict/state), 422 (business rule), 429.

## 1. Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /auth/register | Public | `{name,email,password}`. Creates user + empty profile, sends verification email |
| POST | /auth/login | Public | `{email,password}`. Sets cookies, returns user |
| POST | /auth/refresh | Cookie | Rotates refresh token |
| POST | /auth/logout | User | Revokes current session |
| POST | /auth/logout-all | User | Revokes all sessions |
| POST | /auth/verify-email | Public | `{token}` |
| POST | /auth/resend-verification | User | Rate limited |
| POST | /auth/forgot-password | Public | `{email}`. Always 204 |
| POST | /auth/reset-password | Public | `{token,newPassword}`. Revokes all sessions |
| POST | /auth/change-password | User | `{currentPassword,newPassword}` |
| GET | /auth/sessions | User | List devices |
| DELETE | /auth/sessions/:id | User | Revoke one |

## 2. Me, profile, resume

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /me | User | User + roles (platform, org memberships, staff roles) + onboarding flag |
| PATCH | /me | User | Update name |
| DELETE | /me | User | Account deletion (anonymize) |
| GET | /me/profile | User | Full profile with all sections |
| PUT | /me/profile | User | Basics: headline, bio, location, links, `isPublic`, `showContactEmail`, `lookingForTeam`, `avatarFileId` |
| POST | /me/profile/complete-onboarding | User | Marks onboarding done if minimum fields exist |
| GET | /me/profile/completeness | User | `{score, missing: [...]}` |
| GET/POST | /me/education | User | List / create |
| PATCH/DELETE | /me/education/:id | User | |
| GET/POST | /me/experience | User | |
| PATCH/DELETE | /me/experience/:id | User | |
| GET/POST | /me/projects | User | Portfolio projects |
| PATCH/DELETE | /me/projects/:id | User | |
| GET/POST | /me/achievements | User | |
| PATCH/DELETE | /me/achievements/:id | User | |
| PUT | /me/skills | User | Replace set: `[{name, level}]`. Unknown names create catalogue entries (lower-cased, deduped) |
| GET | /me/resume | User | Auto resume JSON: basics, education, work, projects, skills, achievements, `hackathons[]` (participation, team, submission, prizes), certificates |
| GET | /me/registrations | User | My registrations with hackathon summary and team |
| GET | /me/submissions | User | |
| GET | /me/certificates | User | |
| GET | /skills?q= | Public | Autocomplete |
| GET | /profiles/:slug | Public | Public profile (respects `isPublic`; hides contact email unless allowed). 404 if private |

## 3. Uploads

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /uploads/presign | User | `{purpose, mimeType, sizeBytes}` returns `{fileId, uploadUrl, headers, expiresAt}` |
| POST | /uploads/:id/confirm | User | Verifies object, returns `{fileId, url}` |
| DELETE | /uploads/:id | User | Owner only |

Limits: AVATAR 2 MB (jpeg/png/webp). Other image purposes 10 MB. Purposes beyond AVATAR require the matching org/hackathon permission.

## 4. Organizations

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /organizations | Verified | Apply: name, type, city, country, allowedEmailDomains. Status PENDING |
| GET | /organizations/:slug | Public | Public page + upcoming hackathons (ACTIVE only) |
| GET | /me/organizations | User | Orgs I belong to + my role |
| PATCH | /organizations/:oid | OrgAdmin | Edit details |
| GET | /organizations/:oid/members | OrgStaff | |
| POST | /organizations/:oid/members | OrgAdmin | Add by email (existing user) with role |
| PATCH | /organizations/:oid/members/:userId | OrgAdmin | Change role. Cannot demote the last OWNER |
| DELETE | /organizations/:oid/members/:userId | OrgAdmin | |

## 5. Public hackathon discovery

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /hackathons | Public | Filters: `q, mode, phase, city, tag, orgSlug, from, to, sort=startsAt|deadline|newest` |
| GET | /hackathons/:hid | Public* | Full public detail: tracks, prizes, sponsors, schedule, FAQs, mentors, judges (names only), computed `phase`, seats left, my registration state if logged in. *PRIVATE needs membership/domain |
| GET | /hackathons/:hid/projects | Public | Gallery. Only when results are published (or organizer opened it) |
| GET | /projects/:id | Public | Project detail with team (after results) |
| GET | /hackathons/:hid/winners | Public | After results |
| GET | /certificates/verify/:code | Public | `{valid, holder, hackathon, type, issuedAt}` |

## 6. Hackathon management (organizer)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /organizations/:oid/hackathons | OrgAdmin | Create DRAFT. Org must be ACTIVE |
| GET | /organizations/:oid/hackathons | OrgStaff | All incl. drafts |
| PATCH | /hackathons/:hid | OrgAdmin | Edit. Date/limit changes after publish are audited and notified |
| POST | /hackathons/:hid/publish | OrgAdmin | Validates completeness |
| POST | /hackathons/:hid/unpublish | OrgAdmin | Only if no approved registrations |
| POST | /hackathons/:hid/cancel | OrgAdmin | Notifies registrants |
| POST | /hackathons/:hid/archive | OrgAdmin | |
| POST | /hackathons/:hid/clone | OrgAdmin | Copies config only |
| DELETE | /hackathons/:hid | OrgAdmin | Soft delete, only DRAFT or no registrations |
| CRUD | /hackathons/:hid/tracks[/:id] | OrgAdmin | |
| CRUD | /hackathons/:hid/prizes[/:id] | OrgAdmin | |
| CRUD | /hackathons/:hid/sponsors[/:id] | OrgAdmin | |
| CRUD | /hackathons/:hid/schedule[/:id] | OrgStaff | |
| CRUD | /hackathons/:hid/faqs[/:id] | OrgStaff | |
| CRUD | /hackathons/:hid/registration-questions[/:id] | OrgAdmin | Locked once registrations exist (editing text allowed, type change not) |
| CRUD | /hackathons/:hid/criteria[/:id] | OrgAdmin | Locked once any score exists |
| GET | /hackathons/:hid/dashboard | OrgStaff | Aggregates (registrations by status/day, check-in rate, teams, submissions, judging progress, top skills, college split) |
| GET | /hackathons/:hid/audit-log | OrgAdmin | |

## 7. Registration and check-in

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /hackathons/:hid/registrations | Verified | `{answers}`. Enforces window, onboarding, capacity (transactional). Returns status APPROVED/PENDING/WAITLISTED |
| GET | /hackathons/:hid/registrations/me | User | |
| DELETE | /hackathons/:hid/registrations/me | User | Withdraw. Removes from team, promotes waitlist |
| GET | /registrations/:id/qr | User (owner) | `{qrToken}` for the frontend to render |
| GET | /hackathons/:hid/registrations | OrgStaff | Filters: status, q, checkedIn, hasTeam. Includes answers and profile summary |
| PATCH | /registrations/:id | OrgStaff | `{status}` |
| POST | /hackathons/:hid/registrations/bulk-status | OrgStaff | `{ids[], status}` |
| GET | /hackathons/:hid/registrations/export | OrgStaff | CSV |
| POST | /hackathons/:hid/check-in | Staff/Volunteer | `{qrToken}` or `{registrationId}`. 409 `ALREADY_CHECKED_IN` with time |
| DELETE | /registrations/:id/check-in | OrgAdmin | Undo |

## 8. Teams

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /hackathons/:hid/teams | Verified | `{name, description?, lookingForMembers?, lookingForSkills?}`. Needs APPROVED registration |
| GET | /hackathons/:hid/teams | User (registered) | Browse teams; `?lookingForMembers=true&skill=` |
| GET | /hackathons/:hid/participants | User (registered) | Participants with `lookingForTeam`, skills filter, minimal public profile fields only |
| GET | /teams/:id | Member / OrgStaff | Includes invite code for members |
| PATCH | /teams/:id | Leader | |
| DELETE | /teams/:id | Leader | Before submission is submitted |
| POST | /teams/join | Verified | `{inviteCode}` |
| POST | /teams/:id/invites | Leader | `{userId}` or `{email}` |
| GET | /me/team-invites | User | Pending invites |
| POST | /team-invites/:id/accept | User | |
| POST | /team-invites/:id/decline | User | |
| DELETE | /team-invites/:id | Leader | Revoke |
| POST | /teams/:id/rotate-code | Leader | |
| POST | /teams/:id/transfer-leadership | Leader | `{userId}` |
| DELETE | /teams/:id/members/:userId | Leader | Remove |
| POST | /teams/:id/leave | Member | |

Errors: `TEAM_FULL`, `TEAM_LOCKED`, `ALREADY_IN_TEAM`, `REGISTRATION_CLOSED`.

## 9. Submissions

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /teams/:id/submission | Member / OrgStaff | |
| PUT | /teams/:id/submission | Member | Upsert draft. Fails `SUBMISSION_LOCKED` after deadline |
| POST | /teams/:id/submission/media | Member | `{fileId?, url?, kind, caption}` |
| PATCH/DELETE | /submissions/:id/media/:mediaId | Member | |
| POST | /submissions/:id/submit | Member | Validates required fields |
| POST | /submissions/:id/unsubmit | Member | Before deadline only |
| GET | /hackathons/:hid/submissions | OrgStaff | Full detail with team info |
| POST | /submissions/:id/disqualify | OrgAdmin | `{note}` |
| POST | /submissions/:id/reinstate | OrgAdmin | |

## 10. Judging

Organizer side:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /hackathons/:hid/staff/invites | OrgAdmin | `{email, role}` |
| GET | /hackathons/:hid/staff | OrgStaff | |
| DELETE | /hackathons/:hid/staff/:id | OrgAdmin | |
| POST | /staff/invites/accept | User | `{token}` (email must match, or be claimed after login) |
| POST | /staff/invites/decline | User | `{token}` |
| POST | /hackathons/:hid/judging/auto-assign | OrgAdmin | `{judgesPerSubmission}`. Balanced, excludes conflicts |
| POST | /hackathons/:hid/judging/assignments | OrgAdmin | Manual `{staffId, submissionId}` |
| DELETE | /judging/assignments/:id | OrgAdmin | Only if no scores |
| POST | /judging/assignments/:id/reopen | OrgAdmin | Un-finalize |
| GET | /hackathons/:hid/judging/progress | OrgStaff | Per judge: assigned, finalized |
| GET | /hackathons/:hid/leaderboard | OrgAdmin | Ranked, with per-judge breakdown and score spread |
| POST | /hackathons/:hid/judging/lock | OrgAdmin | Sets `judgingLockedAt`. Requires all assignments finalized, or `force: true` |
| POST | /hackathons/:hid/prizes/:prizeId/awards | OrgAdmin | `{submissionId}` |
| DELETE | /awards/:id | OrgAdmin | Before results publish |
| POST | /hackathons/:hid/results/publish | OrgAdmin | Needs judging locked. Sets `resultsPublishedAt`, notifies |

Judge side (responses are blind-redacted when `blindJudging=true`):

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /me/judging/hackathons | Judge | Events where I am an active judge |
| GET | /hackathons/:hid/judging/my-assignments | Judge | List with progress; fields: anonymousCode, title, tagline, track, finalized |
| GET | /judging/assignments/:id | Judge (owner) | Submission content, criteria, my existing scores |
| PUT | /judging/assignments/:id/scores | Judge (owner) | `{scores:[{criterionId,value,comment?}], overallComment?}`. Validates 0..maxScore. Autosave friendly |
| POST | /judging/assignments/:id/finalize | Judge (owner) | Requires all criteria scored |

## 11. Announcements and notifications

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /hackathons/:hid/announcements | OrgStaff | `{title, body, audience, pinned, sendEmail}` |
| GET | /hackathons/:hid/announcements | Registered / staff | Filtered by audience |
| PATCH/DELETE | /announcements/:id | OrgStaff | |
| GET | /me/notifications | User | `?unread=true` |
| GET | /me/notifications/unread-count | User | |
| POST | /me/notifications/read | User | `{ids[]}` or `{all:true}` |

## 12. Certificates

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /hackathons/:hid/certificates/issue | OrgAdmin | `{types:[...]}` bulk. Idempotent |
| GET | /hackathons/:hid/certificates | OrgAdmin | |
| GET | /certificates/:id | Owner | Record + verify URL (PDF in phase 2) |

## 13. Platform admin

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /admin/organizations?status= | SuperAdmin | |
| POST | /admin/organizations/:id/approve | SuperAdmin | Notifies owner |
| POST | /admin/organizations/:id/suspend | SuperAdmin | Hides its hackathons from listing |
| GET | /admin/users?q= | SuperAdmin | |
| POST | /admin/users/:id/suspend | SuperAdmin | Revokes sessions |
| POST | /admin/users/:id/reactivate | SuperAdmin | |
| GET | /admin/audit-log | SuperAdmin | |
| CRUD | /admin/skills[/:id] | SuperAdmin | Merge duplicates |

## 14. Internal and health

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /health | Public | DB check |
| GET | /api/internal/cron/outbox | `CRON_SECRET` | Send queued emails |
| GET | /api/internal/cron/cleanup | `CRON_SECRET` | Pending uploads, expired tokens/invites |

## 15. Example payloads

Register for a hackathon:

```json
POST /api/v1/hackathons/dmce-hack-2026/registrations
{ "answers": { "q_cuid_1": "Third year", "q_cuid_2": ["Web", "AI"] } }
```

```json
201
{ "data": { "id": "clx...", "status": "APPROVED", "qrToken": "...", "waitlistPosition": null } }
```

Judge scoring (blind):

```json
GET /api/v1/judging/assignments/clx...
{ "data": {
    "id": "clx...",
    "submission": { "anonymousCode": "P-017", "title": "...", "description": "...", "repoUrl": "...", "demoUrl": "...", "media": [] },
    "criteria": [ { "id": "c1", "name": "Innovation", "maxScore": 10, "weight": 2 } ],
    "myScores": [],
    "finalizedAt": null
} }
```

Error:

```json
409
{ "error": { "code": "TEAM_FULL", "message": "This team already has 4 members.", "requestId": "req_..." } }
```

## 16. Endpoint-level rules worth testing

1. Any `:id` route must prove the caller's access to that specific resource (IDOR tests).
2. After `submissionDeadline`, all submission/team mutation endpoints return `SUBMISSION_LOCKED` or `TEAM_LOCKED`, regardless of role except OrgAdmin override.
3. Judge responses contain none of: team name, member data, college, `teamId`.
4. Registration is idempotent: a second POST returns the existing registration (200), not a duplicate error storm.
