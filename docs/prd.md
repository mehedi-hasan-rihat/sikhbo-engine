# Product Requirements Document (PRD) — Sikhbo Engine

**Version**: 1.0.0
**Status**: In Development
**Last Updated**: October 2026

---

## 1. Executive Summary

Sikhbo Engine is a full-stack project submission and review platform built for an educational context. It enables students to submit their capstone/project work and allows mentors to review, evaluate, and provide decisions on those submissions through a structured dashboard.

The system enforces strict role-based access control — students can only submit and track their own work, while mentors have elevated privileges to manage the entire review pipeline. The platform is designed for reliability, security, and a clean user experience on both ends of the workflow.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Students can submit projects without friction | Submission success rate ≥ 95% |
| Mentors can process reviews efficiently | Average review time < 2 min per submission |
| System prevents abuse and spam | Zero duplicate submissions per user; rate limiting enforced |
| Secure access control | No unauthorized role escalation incidents |
| Dashboard provides actionable insight | Aggregated stats always reflect real-time DB state |

---

## 3. User Personas & Roles

### 3.1 Student (`STUDENT`)
- A registered learner on the platform.
- Can sign up via the public registration page.
- Can submit multiple projects, but each GitHub repository can only be submitted once per student.
- Can view all their own submissions and their current review statuses.
- Cannot access any other student's submission or the mentor dashboard.

### 3.2 Mentor (`MENTOR`)
- A trusted evaluator / admin-level user.
- Created via database seed — no public signup path for this role.
- Has full read access to all submissions across all students.
- Can approve or reject any submission with a single action.
- Has access to aggregated statistics and filtered views of the submission pipeline.
- Cannot self-register or be promoted by a student.

---

## 4. Feature Requirements

### 4.1 Authentication & Authorization

**Business Logic:**
- Unauthenticated requests to protected routes are rejected.
- A student attempting to access a mentor-only resource is denied.
- Passwords are never stored in plain text.
- Authentication is token-based and stateless — no server-side sessions.
- Expired tokens are treated the same as missing tokens.

**Flows:**
- Students can self-register with name, email, and password.
- Any user (student or mentor) logs in with email and password; receives a token on success.
- Mentor accounts are seeded directly into the database — no public registration path.

**Validation Rules:**
- Email must be a valid format and unique across the system.
- Password minimum 6 characters.
- All required fields must be present; missing fields produce field-level error messages.

---

### 4.2 Submission Portal (Student View)

**Business Logic:**
- A student may submit multiple projects. Each GitHub repository URL can only be submitted once per student — duplicate repo submissions are rejected.
- Duplicate prevention is enforced at both the application layer (service check) and database layer (`@@unique([studentId, repoUrl])` constraint).
- Submission is only available to authenticated students.
- The student can view all their submissions at any time.
- A student cannot view or access another student's submission.

**Submission Fields:**
| Field | Required | Constraints |
|---|---|---|
| Project Name | Yes | 3–100 characters |
| GitHub Repo URL | Yes | Valid URL, must be a github.com domain |
| Live Demo URL | No | Valid URL if provided |
| Description | Yes | 20–500 characters |

**Rate Limiting:**
- The submission endpoint is rate-limited per IP to prevent spam.
- Clients that exceed the limit are told to retry after a cooldown period.

**Status Lifecycle:**
```
[PENDING] ──► [APPROVED]
           └─► [REJECTED]
```
- Default status on creation: `PENDING`.
- Status is read-only from the student side — only mentors can change it.

---

### 4.3 Review Dashboard (Mentor View)

**Business Logic:**
- Mentors see all submissions across all students.
- All filtering and pagination is processed server-side — the client never receives a full unfiltered dataset.
- Approval and rejection actions are idempotent — acting on an already-decided submission returns success without side effects.

**Data Table:**
- Displays: Student Name, Project Name, Repo URL, Live Demo, Submitted At, Status.
- Default sort: newest first.
- Paginated with configurable page size (default 10).
- Pagination metadata is included in every list response.

**Filtering:**
- Filter by status: All (default), Pending, Approved, Rejected.
- Filters are applied server-side via query parameters.
- Filters can be composed (e.g., status + project name search).

**Review Actions:**
- A mentor can update any submission's status to Approved or Rejected.
- Only mentor-role users can perform this action.

**Aggregated Statistics:**
- Displayed at the top of the dashboard.
- Computed server-side in a single query.
- Includes: Total Submissions, Total Pending, Total Approved, Total Rejected.

---

## 5. Non-Functional Requirements

### 5.1 Security
- All protected routes require a valid auth token — no exceptions.
- Role checks are enforced before any business logic executes.
- Sensitive data (passwords, secrets) is never returned in API responses.
- All secrets are managed via environment configuration — never hardcoded.

### 5.2 Validation
- All incoming request data is validated before reaching business logic.
- Invalid input produces structured, field-level error messages.

### 5.3 Error Handling
- All errors return a consistent response shape across the entire API.
- Internal error details and stack traces are never exposed to clients.

### 5.4 Performance
- Aggregated statistics are computed in a single database query.
- List endpoints use pagination — full table scans are avoided.

---

## 6. Out of Scope (v1.0)

- Email notifications (submission received, status change).
- File/attachment uploads (only URLs are accepted).
- Mentor feedback/comments on individual submissions.
- Admin user management UI.
- OAuth / social login.
- Refresh token rotation.

---

## 7. Open Questions & Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Can a student submit multiple projects? | Yes — students can submit multiple projects, but the same GitHub repo URL cannot be submitted twice by the same student. |
| 2 | Can a mentor undo an approval/rejection? | Yes — status can be toggled freely by any mentor. |
| 3 | Should rate limiting apply globally or per-user? | Per-IP for submission endpoint to catch unauthenticated spam. |
| 4 | What happens if a student tries to view another student's submission? | Denied — ownership check enforced at service layer. |

---

> For endpoint definitions, request/response shapes, and status codes — see [`api.md`](./api.md).
