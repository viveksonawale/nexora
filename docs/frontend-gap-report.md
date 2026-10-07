# Frontend Gap Report

## 1. Page Inventory

**Existing Pages:**
- `/` (Landing page)
- `/about`
- `/features`
- `/hackathons` (Public hackathon listing)
- `/hackathons/[id]` (Public hackathon details)
- `/hackathons/[id]/overview`
- `/hackathons/[id]/prizes`
- `/hackathons/[id]/projects`
- `/hackathons/[id]/schedule`
- `/join` (Mock invitation acceptance page; not fully wired to API)
- `/attendance` (Check-in components, likely related to volunteer/organizer tools)
- `/attendance/select`
- `/attendance/student`
- `/attendance/confirm`

## 2. API Inventory

**Implemented (per code vs `api-spec.md`):**
Almost all CRUD and business logic APIs in `api-spec.md` are implemented in `app/api/v1/`, including registration, submissions, organizations, team management, judging, etc.

**Missing APIs:**
- `GET /projects/:id`
- `GET /hackathons/:hid/projects`
- `GET /hackathons/:hid/winners`
- `GET /hackathons/:hid/submissions`
- `GET /api/internal/cron/cleanup`
- All OAuth endpoints (e.g., `GET /auth/oauth/:provider/start`, `GET /auth/oauth/:provider/callback`)

## 3. Matrix: Page to Endpoint Coverage

- **`/hackathons`**: `GET /api/v1/hackathons`
- **`/hackathons/[id]`** (and sub-pages): `GET /api/v1/hackathons/:hid` (sub-pages rely on data nested in this response or specific endpoints like `/schedule`, etc.)
- **`/join`**: Currently uses mocked timeouts and state; no real API integration.
- **Unused Endpoints**: Roughly 95% of the implemented API endpoints (Profile management, Hackathon creation wizard, Organization setup, Judging, Submissions, Check-ins, and Admin controls) currently have **no frontend UI coverage**.

## 4. Missing Pages by Role

**Public:**
- Sign up, Sign in, Verify email, Forgot password, Reset password

**Participant:**
- Profile & Onboarding
- Auto resume view
- Hackathon registration flow
- My registrations
- Team create / join / invite / manage
- Submission editor
- Certificates
- Notifications

**Organizer (Owner/Admin/Staff):**
- Organization application and settings
- Hackathon create/edit wizard
- Configuration views (tracks, prizes, sponsors, schedule, FAQs, registration questions, criteria)
- Registration management
- Check-in scanner (partially exists in `/attendance` but needs integration)
- Announcements
- Dashboard (metrics and progress)
- Results and certificates management

**Judge:**
- Assigned events listing
- Assignment list
- Scoring screen (with autosave functionality)
- Finalize submission flow

**Super Admin:**
- Organization approvals
- User management (suspend, reactivate)
- Audit log
- Skills catalogue management

## 5. Auth State Today

**API:**
- Basic authentication is fully implemented (`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/verify-email`, `/auth/refresh`, `/auth/sessions`, etc.).
- Authentication utilizes HTTP-only cookies (`access_token`) validated in a middleware-style wrapper (`server/lib/api.ts`).
- OAuth is **completely absent** in the backend API.

**Frontend:**
- **UI:** No real sign-up or sign-in pages exist. The `/join` page is a mock UI for accepting invitations.
- **State:** No frontend Session Provider or React context exists.
- **Protection:** No automatic 401 handling, silent token refreshing, or frontend route guards are implemented.

## 6. Dynamic QR Tokens

**Mismatch Found:**
The `api-spec.md` mentions a static per-registration QR token, but the frontend spec asks for dynamic ones.
After checking the code (`RegistrationService.getQrToken`), the backend **does not** support rotating tokens. It generates a single 16-byte hex string (`qrToken`) at the time of registration and simply returns that static string when requested.

**Proposed Backend Design:**
Modify `GET /registrations/:id/qr` to generate and return a short-lived JSON Web Token (JWT) signed by a server secret, valid for a short time (e.g., 30 seconds). The token would contain the `registrationId`. The check-in endpoint would be updated to decode and verify this short-lived JWT rather than performing a static string match.

## 7. Extracted Design System

**Summary:**
- **Colors & Theming:** Handled via Tailwind and raw CSS variables in `app/globals.css`. Support for `data-theme="dark"` (canvas: `#121110`, elevated: `#1c1a17`) and light mode (canvas: `#faf8f4`). Primary accent is Orange (`#F97316`).
- **Typography:** Relies on Sans-serif for body text, display fonts (likely Inter/Playfair for headings) and specific monospace fonts, mapped via CSS variables (`--font-sans`, `--font-display`, etc.).
- **Reusable Components:** Discovered `ShinyButton`, `LoadingSpinner` (Delta-V equalizer bars), `Navbar`, `ContactForm`, `FeaturesGrid`, `SpotlightCard`, `DotField`, `ColorBends`, and `SmoothScroll` in `components/`.

## 8. Risks, Inconsistencies, and Questions

1. **Missing Backend Features:** As listed in section 2, the `submissions`, `projects`, and `winners` fetching endpoints do not exist in the backend. Do you want me to implement them during Phase 4, or should I stub them for now?
2. **Attendance/Check-in Pages:** The project already contains some standalone check-in mock pages in `/attendance/...`. Should I refactor and integrate these into the new Organizer Dashboard flow, or leave them as standalone public routes?
3. **OAuth Setup:** Before we begin Phase 3, I will need you to define the exact redirect URIs you'd like to use so I can build the flow properly. Also, which OAuth client library do you prefer (e.g. NextAuth/Auth.js or Arctic)?
4. **Dynamic QR:** Do you approve the proposed JWT-based rotating QR solution?

Ready to proceed. Please provide your answers to the questions and approve the page list priorities so we can move to Phase 1.
