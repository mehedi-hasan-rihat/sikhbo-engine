# Architecture — Sikhbo Engine (Backend)

**Version**: 1.0.0
**Last Updated**: October 2026

> For feature requirements see [`prd.md`](./prd.md). For endpoint contracts see [`api.md`](./api.md).

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |
| Environment | dotenv |

---

## 2. System Architecture

```
Client (Next.js)
│
│  Authorization: Bearer <token>
▼
┌─────────────────────────────────┐
│        Express API Router       │
│         /api/v1/*               │
└────────────┬────────────────────┘
             │
             ▼
     [ Rate Limiter ]          ← blocks spam before any logic runs
             │
             ▼
     [ authenticate ]          ← verifies JWT, attaches req.user
             │
             ▼
     [ authorize(roles) ]      ← checks req.user.role vs allowed roles
             │
             ▼
     [ validate(schema) ]      ← Zod schema validation on req.body
             │
             ▼
     [ Controller ]            ← parse request, call service, send response
             │
             ▼
     [ Service ]               ← all business logic lives here
             │
             ▼
     [ Prisma Client ]         ← DB queries, no raw SQL
             │
             ▼
       [ PostgreSQL ]
             │
             ▼ (on error, anywhere in the chain)
     [ Global Error Handler ]  ← catches all thrown errors, formats response
```

---

## 3. Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # All model definitions & relations
│   └── seed.ts                # Seeds the Mentor account into DB
│
├── src/
│   ├── config/
│   │   └── env.ts             # Loads & exports validated env variables
│   │
│   ├── constants/
│   │   ├── enums.ts           # Role, SubmissionStatus enums
│   │   └── messages.ts        # Shared error/success message strings
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── submission.controller.ts
│   │
│   ├── middlewares/
│   │   ├── authenticate.ts    # JWT verification → attaches req.user
│   │   ├── authorize.ts       # RBAC role check
│   │   ├── rateLimiter.ts     # express-rate-limit configuration
│   │   ├── validate.ts        # Zod validation wrapper
│   │   └── errorHandler.ts    # Global error handler (last middleware)
│   │
│   ├── routes/
│   │   ├── index.ts           # Mounts all route groups under /api/v1
│   │   ├── auth.routes.ts
│   │   └── submission.routes.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts    # register, login, token logic
│   │   └── submission.service.ts  # create, getOwn, list, updateStatus, stats
│   │
│   ├── types/
│   │   └── express.d.ts       # Extends Express Request with req.user type
│   │
│   ├── utils/
│   │   ├── token.ts           # JWT sign & verify helpers
│   │   ├── hash.ts            # bcrypt hash & compare helpers
│   │   └── logger.ts          # Request/error logging
│   │
│   ├── validations/
│   │   ├── auth.validation.ts
│   │   └── submission.validation.ts
│   │
│   ├── app.ts                 # Express app setup, middleware registration
│   └── server.ts              # HTTP server bootstrap, port binding
│
├── .env.example               # Required env variable template
├── tsconfig.json
└── package.json
```

---

## 4. Auth & RBAC Implementation

### 4.1 Token Flow

```
register/login
     │
     ▼
verify credentials
     │
     ▼
sign JWT → payload: { userId, role, email }, expiry: 7d
     │
     ▼
return token to client
     │
     ▼  (subsequent requests)
client sends: Authorization: Bearer <token>
     │
     ▼
authenticate middleware → jwt.verify() → attach to req.user
     │
     ▼
authorize middleware → check req.user.role ∈ allowedRoles
```

### 4.2 Middleware Signatures

```ts
// authenticate.ts
authenticate(req, res, next)
// → on success: req.user = { userId, role, email }
// → on failure: throws 401

// authorize.ts
authorize(...roles: Role[])
// → returns middleware
// → on success: calls next()
// → on failure: throws 403

// validate.ts
validate(schema: ZodSchema)
// → returns middleware
// → on success: calls next()
// → on failure: throws 400 with field-level errors
```

### 4.3 Route Protection Pattern

```ts
// Public
router.post('/auth/register', validate(registerSchema), register)

// Student only
router.post('/submissions', authenticate, authorize('STUDENT'), validate(submitSchema), createSubmission)

// Mentor only
router.get('/submissions', authenticate, authorize('MENTOR'), listSubmissions)
router.patch('/submissions/:id/status', authenticate, authorize('MENTOR'), validate(statusSchema), updateStatus)
```

---

## 5. Key Architectural Patterns

### 5.1 Controller → Service Separation
Controllers only handle HTTP concerns (parse request, call service, send response). All business logic — duplicate checks, ownership enforcement, status transitions — lives exclusively in services. Controllers never touch Prisma directly.

### 5.2 Ownership Enforcement
Before returning or modifying a submission, the service layer checks that the requesting user owns the resource. This is not done in middleware — it requires a DB lookup with the actual record.

```ts
// submission.service.ts
const submission = await prisma.submission.findUnique({ where: { id } })
if (submission.studentId !== req.user.userId) throw new ForbiddenError()
```

### 5.3 Aggregated Stats — Single Query
Stats are computed in one grouped query, not four separate count calls:

```ts
const stats = await prisma.submission.groupBy({
  by: ['status'],
  _count: { status: true },
})
```

### 5.4 Global Error Handler
All services throw typed errors (e.g. `NotFoundError`, `ConflictError`, `ForbiddenError`). The global error handler in `errorHandler.ts` catches them and maps to the correct HTTP status and response shape. No try/catch needed in controllers.

### 5.5 Environment Variables
All config is loaded and validated in `src/config/env.ts` at startup. If a required variable is missing, the server fails fast before binding to a port.

---

## 6. Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`) |
| `PORT` | HTTP server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
