# Work Plan — Sikhbo Engine (Backend)

**Version**: 1.0.0
**Last Updated**: October 2026
**Scope**: Backend only. Rate limiting excluded for now — added at the end.

---

## Phase Overview

```
Phase 1 → Project Setup & Config
Phase 2 → Database & Prisma
Phase 3 → Core Infrastructure (Utils + Middlewares)
Phase 4 → Auth Feature (Register + Login)
Phase 5 → Submission Feature (Student)
Phase 6 → Submission Feature (Mentor)
Phase 7 → Rate Limiting
```

---

## Phase 1 — Project Setup & Config ✅

- [x] Init Node.js project: `npm init -y`
- [x] Install TypeScript: `npm i -D typescript ts-node nodemon @types/node @types/express`
- [x] Init tsconfig: `npx tsc --init` (set `rootDir: src`, `outDir: dist`, `strict: true`)
- [x] Install runtime deps:
  ```
  npm i express prisma @prisma/client jsonwebtoken bcryptjs zod dotenv cors
  npm i -D @types/jsonwebtoken @types/bcryptjs @types/cors
  ```
- [x] Create folder structure per `arch.md`
- [x] `src/config/env.ts` — load & validate all env vars, fail fast if missing
- [x] `.env` and `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`
- [x] `src/app.ts` — Express app, cors, json parser, mount routes
- [x] `src/server.ts` — bind to port, start listening
- [x] Add `dev` script to `package.json`: `nodemon src/server.ts`

**Exit criteria**: `npm run dev` starts without errors. Server responds on configured port. ✅

---

## Phase 2 — Database & Prisma ✅

- [x] `npx prisma init` — creates `prisma/schema.prisma` and `.env` entry
- [x] Write full schema (per `database.md`):
  - `User` model with `Role` enum
  - `Submission` model with `SubmissionStatus` enum
  - Indexes on `studentId`, `status`, `createdAt`
  - `@@map` on both models
- [x] `npx prisma migrate dev --name init`
- [x] `npx prisma generate`
- [x] Write `prisma/seed.ts` — upsert Mentor account with hashed password
- [x] Add `seed` script to `package.json` — `npm run seed`
- [x] `npm run seed`

**Exit criteria**: Tables exist in DB. Mentor row is in `users`. ✅

---

## Phase 3 — Core Infrastructure ✅

### Constants & Types
- [x] ~~`src/constants/enums.ts`~~ — removed, enums come from `generated/prisma/enums.ts`
- [x] `src/constants/messages.ts` — shared message strings (no inline strings in controllers)
- [x] `src/types/express.d.ts` — extend `Express.Request` with `user: { userId, role, email }`

### Utils
- [x] `src/utils/hash.ts` — `hashPassword(plain)`, `comparePassword(plain, hash)`
- [x] `src/utils/token.ts` — `signToken(payload)`, `verifyToken(token)`
- [x] `src/utils/logger.ts` — simple request logger middleware

### Middlewares
- [x] `src/middlewares/authenticate.ts` — extract & verify JWT → attach `req.user` → throw `401` on failure
- [x] `src/middlewares/authorize.ts` — `authorize(...roles)` → throw `403` if role not in list
- [x] `src/middlewares/validate.ts` — `validate(schema)` → throw `400` with field errors on Zod failure
- [x] `src/middlewares/errorHandler.ts` — catch all thrown errors → map to correct status + response shape

**Exit criteria**: Unit-testable utils exist. Middlewares can be imported and composed on routes. ✅

---

## Phase 4 — Auth Feature ✅

- [x] `src/validations/auth.validation.ts`
  - `registerSchema` — name, email, password
  - `loginSchema` — email, password
- [x] `src/services/auth.service.ts`
  - `register(data)` — check email uniqueness → hash password → create user → return token
  - `login(data)` — find user by email → compare password → return token
- [x] `src/controllers/auth.controller.ts`
  - `register` handler
  - `login` handler
- [x] `src/routes/auth.routes.ts`
  - `POST /register` → `validate(registerSchema)`, `register`
  - `POST /login` → `validate(loginSchema)`, `login`
- [x] Mount in `src/routes/index.ts` under `/api/v1/auth`

**Exit criteria**:
- `POST /api/v1/auth/register` → `201` with token
- Duplicate email → `409`
- `POST /api/v1/auth/login` → `200` with token
- Wrong password → `401`
- Missing fields → `400` with field errors ✅

---

## Phase 5 — Submission Feature (Student) ✅

- [x] `src/validations/submission.validation.ts`
  - `createSubmissionSchema` — projectName, repoUrl, liveUrl (optional), description
- [x] `src/services/submission.service.ts`
  - `createSubmission(userId, data)` — check existing submission → insert → return created record
  - `getMySubmission(userId)` — find by `studentId` → return or throw `404`
- [x] `src/controllers/submission.controller.ts`
  - `createSubmission` handler
  - `getMySubmission` handler
- [x] `src/routes/submission.routes.ts`
  - `POST /` → `authenticate`, `authorize(STUDENT)`, `validate(createSubmissionSchema)`, `createSubmission`
  - `GET /me` → `authenticate`, `authorize(STUDENT)`, `getMySubmission`

**Exit criteria**:
- `POST /api/v1/submissions` → `201` with submission object, status `PENDING`
- Second submission from same student → `409`
- Mentor trying to submit → `403`
- No token → `401`
- Invalid repoUrl (not github.com) → `400`
- `GET /api/v1/submissions/me` → `200` with own submission
- Student with no submission → `404` ✅

---

## Phase 6 — Submission Feature (Mentor)

- [ ] `src/validations/submission.validation.ts` (extend)
  - `updateStatusSchema` — status: `APPROVED | REJECTED`
- [ ] `src/services/submission.service.ts` (extend)
  - `listSubmissions({ page, pageSize, status, search })` — paginated, filtered, joined with student
  - `getStats()` — single `groupBy` query returning total, pending, approved, rejected
  - `updateStatus(submissionId, status)` — find submission → update → return updated record
- [ ] `src/controllers/submission.controller.ts` (extend)
  - `listSubmissions` handler
  - `getStats` handler
  - `updateStatus` handler
- [ ] `src/routes/mentor.routes.ts` (new file)
  - `GET /` → `authenticate`, `authorize(MENTOR)`, `listSubmissions`
  - `GET /stats` → `authenticate`, `authorize(MENTOR)`, `getStats`
  - `PATCH /:id/status` → `authenticate`, `authorize(MENTOR)`, `validate(updateStatusSchema)`, `updateStatus`
- [ ] Mount in `src/routes/index.ts` under `/api/v1/mentor/submissions`

**Exit criteria**:
- `GET /api/v1/mentor/submissions` → paginated list with student info and pagination metadata
- `?status=APPROVED` filters correctly
- `?page=2&pageSize=5` paginates correctly
- `GET /api/v1/mentor/submissions/stats` → correct counts in a single query
- `PATCH /api/v1/mentor/submissions/:id/status` → `200` with updated record
- Invalid status value → `400`
- Non-existent submission ID → `404`
- Student trying to access → `403`

---

## Phase 7 — Rate Limiting

- [ ] Install: `npm i express-rate-limit`
- [ ] `src/middlewares/rateLimiter.ts` — 5 requests / 15 min per IP, `Retry-After` header on `429`
- [ ] Apply only to `POST /api/v1/submissions` route

**Exit criteria**: 6th submission attempt within 15 minutes returns `429` with `Retry-After` header.

---

## Reference Docs

| Doc | Purpose |
|---|---|
| [`prd.md`](./prd.md) | Feature requirements & business rules |
| [`arch.md`](./arch.md) | Tech stack, folder structure, middleware patterns |
| [`api.md`](./api.md) | Endpoint contracts, request/response shapes |
| [`database.md`](./database.md) | Schema design, Prisma models, seed script |
