# Nexora Backend Architecture (TRD)

## 1. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js App Router, Route Handlers in `app/api/v1/**/route.ts` | Verify the current stable major when scaffolding. In recent majors dynamic `params` are asynchronous, so check the docs for your version |
| Language | TypeScript, `strict: true` | |
| DB | PostgreSQL | Needed for composite FKs, arrays, JSON, partial/composite indexes |
| ORM | Prisma 6 (`prisma-client-js`) | Schema was validated against Prisma 6. Prisma 7 moved connection URLs into `prisma.config.ts`, so pin the major or migrate the datasource block |
| Validation | Zod | One schema per endpoint, shared with the frontend |
| Auth | `jose` (JWT) + Argon2id hashing | Access token 15 min, refresh token rotation |
| Storage | S3-compatible presigned PUT | AWS SDK v3 `@aws-sdk/client-s3` + `s3-request-presigner` |
| Email | Nodemailer + `EmailOutbox` table | |
| Rate limit | Redis-backed (Upstash or similar) | Optional in dev |
| Logging | `pino` | JSON, `requestId` per request |
| Tests | Vitest + a real Postgres (Docker) for integration | Do not mock the database for constraint tests |

## 2. Architectural style

A modular monolith inside one Next.js app. Route Handlers are thin controllers. Business logic lives in services. Nothing in `app/api` talks to Prisma directly.

```
Request
  -> route.ts (parse + validate with Zod, call withApi wrapper)
  -> withApi: requestId, rate limit, auth, error mapping
  -> policy: can(user, action, resource)
  -> service: business rules, transactions
  -> repository (Prisma queries, select/include)
  -> mapper: Prisma row -> public DTO
  -> JSON envelope
```

Why this and not "logic in route.ts": handlers become untestable, rules get duplicated, and moving to a separate service later becomes a rewrite.

## 3. Folder structure

```
src/
  app/api/v1/
    auth/ ...                  route.ts files only
    hackathons/ ...
  server/
    modules/
      auth/        auth.service.ts, auth.schemas.ts, tokens.ts
      users/       profile.service.ts, resume.service.ts, completeness.ts
      organizations/
      hackathons/  hackathon.service.ts, phase.ts, listing.service.ts
      registrations/
      teams/
      submissions/
      judging/     assignment.service.ts, scoring.ts, redaction.ts
      prizes/
      announcements/
      certificates/
      uploads/
      notifications/
      dashboard/
      admin/
    lib/
      db.ts                    Prisma singleton
      api.ts                   withApi wrapper, envelope helpers
      errors.ts                AppError + error codes
      policies.ts              authorization rules
      rate-limit.ts
      logger.ts
      storage.ts               presign helpers
      email.ts, outbox.ts
      env.ts                   Zod-validated env, fails fast on boot
      ids.ts                   slug, invite code, qr token generation
  prisma/
    schema.prisma              (this folder's database-schema.prisma)
    seed.ts
  tests/
```

## 4. Request pipeline (`withApi`)

1. Generate `requestId`, attach to logs and response header.
2. Rate limit by IP (public) or userId (authenticated). Stricter bucket for `/auth/*`.
3. Resolve the user from the access-token cookie or `Authorization: Bearer`. Load `status`, reject SUSPENDED.
4. Parse and validate body, query, params with Zod. Unknown keys rejected.
5. Run handler. Map thrown `AppError` to the error envelope. Unknown errors become `INTERNAL` with a generic message and a logged stack.

Response envelope:

```
{ "data": ..., "meta": { "nextCursor": "..." } }
{ "error": { "code": "REGISTRATION_CLOSED", "message": "...", "details": {...}, "requestId": "..." } }
```

## 5. Authentication design

- Login verifies the password hash, creates a `Session` row storing only a hash of the refresh token, and sets two httpOnly cookies: `access` (15 min JWT) and `refresh` (30 days, path restricted to `/api/v1/auth`).
- Refresh rotates: old token marked `revokedAt`, new one issued. If a revoked refresh token is presented again, treat it as theft and revoke every session of that user.
- Email verification and password reset tokens: random 32 bytes, stored as SHA-256 hash in `EmailToken`, single use, short expiry.
- Cookie auth means CSRF matters. Use `SameSite=Lax` plus an Origin/Host check on all state-changing requests. If the frontend lives on a different site, revisit this decision.
- Login errors are identical for "no user" and "wrong password". Rate limit by email + IP.

## 6. Authorization design

Policy functions answer "can this user perform this action on this resource". They load membership data once per request and cache it in the request context.

```
can(user, "hackathon:update", hackathon)
  = SUPER_ADMIN
    or orgRole(user, hackathon.organizationId) in [OWNER, ADMIN]
```

Rules:
- Org scoping is derived from the resource, never from client input.
- Judge endpoints resolve the `HackathonStaff` row for the caller and assert `role=JUDGE, status=ACTIVE` plus ownership of the assignment.
- Return 404 (not 403) when the caller should not even know a resource exists, for example another org's draft hackathon.

## 7. Data integrity decisions

| Concern | Mechanism |
|---|---|
| One registration per user per hackathon | `@@unique([hackathonId, userId])` |
| One team per participant per hackathon | `TeamMember.registrationId` unique |
| Team and registration in the same hackathon | Composite FKs through `(id, hackathonId)` |
| One submission per team | `Submission.teamId` unique |
| Judge cannot score a submission twice | `@@unique([staffId, submissionId])` and `@@unique([assignmentId, criterionId])` |
| Anonymous codes unique per hackathon | `@@unique([hackathonId, anonymousCode])` |
| Certificate once per user/type/event | `@@unique([hackathonId, userId, type])` |

Rule of thumb: if a rule can be a DB constraint, make it one. Application checks alone lose races.

## 8. Concurrency: registration capacity

Naive "count then insert" overbooks under parallel requests. Approach:

1. Open a transaction.
2. Lock the hackathon row (`SELECT ... FOR UPDATE` via `$queryRaw`, or an advisory lock keyed by hackathon id).
3. Count APPROVED registrations, decide APPROVED or WAITLISTED, insert.
4. Commit.

The lock serializes registrations per hackathon only, which is fine at campus scale. Required integration test: 50 parallel requests, 10 seats, exactly 10 approved.

## 9. Judging and blind redaction

- Judge-facing DTOs are built by a dedicated mapper (`judgeSubmissionView`) that has no access to team fields. Allow-list, not deny-list.
- Never reuse the organizer DTO and delete fields. Someone adding a new field later would leak it.
- Required test: for a blind hackathon, serialize every judge endpoint response and assert it contains no team name, member name or email.
- Scoring lives in `scoring.ts` as pure functions (input: assignments + criteria, output: ranked list). Pure functions are easy to unit test and to explain in a viva.

## 10. Profile completeness (v1 weights)

| Section | Points |
|---|---|
| Avatar | 10 |
| Headline + bio | 15 |
| Location + at least one link | 10 |
| Education (1+) | 20 |
| Skills (3+) | 20 |
| Projects (1+) | 15 |
| Experience or achievement (1+) | 10 |

## 11. File uploads

1. `POST /uploads/presign` validates purpose, MIME type, size limit per purpose, creates `FileAsset(PENDING)`, returns a presigned PUT URL (5 min) and `fileId`.
2. Client uploads directly to the bucket (the app server never streams the bytes).
3. `POST /uploads/:id/confirm` checks the object exists and its size, optionally reads the first bytes to confirm the real image type, marks `CONFIRMED`, and returns the public URL.
4. A cron job deletes `PENDING` assets older than 24 h (object and row).

Caveat: the declared MIME type at presign can be spoofed. The sniff at confirm is what actually protects you.

## 12. Background work without a worker

Serverless route handlers can be frozen after responding, so fire-and-forget email is unreliable. Pattern:

- Services insert `EmailOutbox` rows inside the same transaction as the business change.
- `GET /api/internal/cron/outbox` (protected by `CRON_SECRET`) sends pending rows with retries and backoff. Triggered by the host's cron or any external scheduler every minute.
- Other cron routes: cleanup pending uploads, expire invites/tokens, promote waitlist if missed.

If you later host on a long-running Node server, replace cron triggers with an in-process or queue worker. The outbox table stays.

## 13. Pagination, filtering, search

- Cursor pagination on `(createdAt, id)` or `(startsAt, id)`. Offset pagination is slow and unstable on changing data.
- Hackathon search v1: `ILIKE` on title/tagline/tags plus filters. If it becomes slow, add Postgres full-text (`tsvector` + GIN) via a raw migration. Prisma does not manage that index natively, so keep it in a SQL migration file.

## 14. Error codes (stable contract)

`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `CONFLICT`, `RATE_LIMITED`, `EMAIL_NOT_VERIFIED`, `ONBOARDING_INCOMPLETE`, `REGISTRATION_CLOSED`, `REGISTRATION_FULL`, `TEAM_FULL`, `TEAM_LOCKED`, `ALREADY_IN_TEAM`, `SUBMISSION_LOCKED`, `JUDGING_LOCKED`, `INVALID_STATE`, `UPLOAD_REJECTED`, `INTERNAL`.

## 15. Testing strategy

| Layer | What | How |
|---|---|---|
| Unit | phase computation, scoring, completeness, policies, redaction mappers | Vitest, no DB |
| Integration | registration capacity, team constraints, auth rotation, judging flow | Vitest + Docker Postgres, migrate per run |
| Contract | every endpoint matches `api-spec.md` response shape | Zod response schemas reused in tests |
| Security | IDOR checks: user A cannot read/modify user B's or org B's resources | Table-driven tests across endpoints |

## 16. Deployment and operations

- Migrations: `prisma migrate deploy` in CI/CD. Never `migrate dev` or `db push` against production.
- Connection pooling: use a pooled `DATABASE_URL` for runtime and a direct `DIRECT_URL` for migrations. On serverless, an unpooled setup exhausts connections quickly.
- Seed script: creates the SUPER_ADMIN from env, a skills catalogue, and optionally a demo college + hackathon.
- Health: `GET /api/v1/health` checks DB connectivity.
- Backups: enable automated Postgres backups on whichever host you choose and test a restore once.

## 17. Known limitations (be honest in the viva)

1. Raw-mean scoring is sensitive to judge strictness (z-score normalisation planned).
2. Static QR tokens can be screenshotted and shared (rotating QR planned).
3. No real-time features. Dashboards poll.
4. Cron-based outbox means email delay of up to a minute.
5. Single database, no read replicas. Fine for campus scale.
