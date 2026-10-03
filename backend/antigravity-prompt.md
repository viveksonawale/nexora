You are a senior backend engineer building the backend of "Nexora", a multi-tenant hackathon management platform, as one Next.js app using Route Handlers. This is a final-year project that must also work as real production-quality software and be defensible in a viva.

## Source of truth

Read these five files completely before writing any code. They are in the `backend/` folder of this workspace:

1. `backend/backend-spec.md` - features, roles, business rules, scope, definition of done
2. `backend/architecture.md` - stack, folder structure, request pipeline, auth, concurrency, testing
3. `backend/api-spec.md` - every endpoint, auth level, payload conventions, error codes
4. `backend/database-schema.prisma` - the data model (already validated against Prisma 6)
5. `backend/.env.example` - all environment variables

If any of these files is missing from the workspace, stop and tell me instead of guessing its content.

## Hard rules

- The five files win over your own preferences. If you believe something in them is wrong, unsafe or inconsistent, do NOT silently change it. Stop, explain the problem with technical reasoning, propose an alternative, and wait for my decision.
- Do not invent APIs, package options or framework behaviour. If you are unsure how a library or the current Next.js version works, read its official documentation or the installed package types first. State any remaining uncertainty.
- Pin Prisma to major version 6. Do not upgrade to 7 without asking, because the datasource block changes.
- TypeScript strict mode. Zod validation on every endpoint. Route handlers stay thin: all logic in `src/server/modules/*` services, authorization in a central policy layer, public responses through explicit allow-list mappers.
- Every org-scoped or resource-scoped endpoint must verify access to that specific resource (no IDOR). Never trust organization ids from the request body.
- Blind judging responses must be built by a dedicated allow-list mapper with no access to team fields.
- Registration capacity must be enforced inside a transaction with a row lock, as described in `architecture.md`.
- No placeholder implementations, no `TODO` returns, no fake data. If something is out of scope for v1 (see section 5 of the spec), leave it out and list it.
- Do not put explanations inside code blocks or code comments beyond what a maintainer needs.

## Build order

Work in phases. After each phase, stop and report before starting the next.

1. Scaffold: Next.js + TypeScript, folder structure from `architecture.md`, env validation (`env.ts`), Prisma client singleton, `withApi` wrapper, error envelope, logger, health endpoint, Docker Compose for local Postgres, first migration from the schema.
2. Auth: register, login, refresh rotation with reuse detection, logout, email verification, password reset, sessions, rate limiting, email outbox + cron route.
3. Profile and resume: profile sections, skills, completeness score, public profile, `/me/resume`, uploads (presign, confirm, avatar).
4. Organizations and platform admin: apply, approve, members, roles, policy layer, audit log.
5. Hackathons: CRUD, tracks, prizes, sponsors, schedule, FAQs, questions, criteria, phase computation, publish rules, public listing with filters and cursor pagination.
6. Registration, waitlist, check-in, teams, invites, submissions with deadline locking.
7. Judging: staff invites, assignment (manual and auto), blind judge endpoints, scoring, leaderboard, lock, awards, results publish.
8. Announcements, notifications, certificates, dashboard aggregates, seed script.

## Verification (required, no exceptions)

For every phase, actually run and report the real output of:

- `tsc --noEmit`
- the linter
- `prisma validate` and `prisma migrate dev` against the local Postgres
- the tests you wrote for that phase

Never claim something works unless you ran it. If you could not run something, say exactly what was not verified and how I can verify it myself. Never fabricate logs, outputs or test results.

Required automated tests across the project:

1. Policy tests: user from org A cannot read or modify org B's resources.
2. 50 parallel registrations on a 10-seat hackathon produce exactly 10 APPROVED.
3. A participant cannot join two teams in the same hackathon, and cannot join a team of a different hackathon.
4. After `submissionDeadline`, submission and team mutations are rejected.
5. For a blind hackathon, no judge endpoint response contains team name, member names, emails or `teamId`.
6. Scoring function unit tests including ties.
7. Refresh token reuse revokes all sessions of that user.

## Reporting format after each phase

- What was built (files and endpoints)
- What was verified, with the real command output summary
- What was not verified
- Deviations from the spec files and why, if any
- Questions or decisions you need from me

## Start now

Begin with a short plan: restate the stack and constraints in your own words, list anything in the five files that looks ambiguous or contradictory, and ask me any blocking questions. Then wait for my confirmation before starting phase 1.
