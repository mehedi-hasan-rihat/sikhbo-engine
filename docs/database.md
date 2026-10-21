# Database Design — Sikhbo Engine

**Version**: 1.0.0
**Last Updated**: October 2026
**ORM**: Prisma
**Database**: PostgreSQL

> For business rules behind these decisions see [`prd.md`](./prd.md). For how services query this schema see [`arch.md`](./arch.md).

---

## 1. Entity Overview

The schema has two entities:

| Model | Description |
|---|---|
| `User` | Represents both Students and Mentors. Role field differentiates them. |
| `Submission` | A project submitted by a Student. One submission per student max. |

There is no separate `Mentor` or `Student` table. A single `User` model with a `role` enum handles both — this avoids joins for identity checks and keeps auth logic simple.

---

## 2. Entity Relationship Diagram

```
┌─────────────────────┐          ┌──────────────────────────┐
│        User         │          │        Submission         │
├─────────────────────┤          ├──────────────────────────┤
│ id (PK, UUID)       │◄────┐    │ id (PK, UUID)            │
│ name                │     └────│ studentId (FK → User.id) │
│ email (UNIQUE)      │          │ projectName              │
│ password            │          │ repoUrl                  │
│ role (ENUM)         │          │ liveUrl (nullable)       │
│ createdAt           │          │ description              │
│ updatedAt           │          │ status (ENUM)            │
└─────────────────────┘          │ createdAt                │
                                 │ updatedAt                │
                                 └──────────────────────────┘

Relationship: User ──< Submission   (one-to-many, enforced as one-to-one via app logic)
```

**Why one-to-many at DB level but one-to-one in practice?**
The DB allows `User → many Submissions` structurally, but the service layer enforces the one-submission-per-student rule by checking for an existing record before inserting. This keeps the schema flexible without a complex unique constraint on a nullable FK pattern, and the duplicate check produces a clearer error message than a raw DB constraint violation.

---

## 3. Models

### 3.1 User

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  submissions Submission[]
}
```

**Field notes:**
- `id` — UUID instead of auto-increment integer. Safer to expose in URLs, no sequential enumeration risk.
- `email` — `@unique` enforced at DB level. Duplicate registration is caught here as a last line of defense (service layer checks first for a cleaner error message).
- `password` — stores the bcrypt hash only. The plain-text password never touches the DB.
- `role` — defaults to `STUDENT`. Mentor role is only assigned via the seed script, never through the API.
- `submissions` — relation field. Prisma uses this to generate the join; no extra column in the DB.

---

### 3.2 Submission

```prisma
model Submission {
  id          String           @id @default(uuid())
  projectName String
  repoUrl     String
  liveUrl     String?
  description String
  status      SubmissionStatus @default(PENDING)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  studentId   String
  student     User   @relation(fields: [studentId], references: [id])
}
```

**Field notes:**
- `liveUrl` — marked `String?` (nullable) because live demo is optional per the PRD.
- `status` — defaults to `PENDING` at DB level, so even if the service forgets to set it, the correct default is applied.
- `studentId` — the foreign key column in the DB. Prisma uses `student` as the relation name for queries.
- `updatedAt` — `@updatedAt` means Prisma automatically updates this timestamp on every write, giving mentors a free audit trail of when status was last changed.

---

### 3.3 Enums

```prisma
enum Role {
  STUDENT
  MENTOR
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

**Why enums instead of plain strings?**
- DB enforces valid values — no invalid status like `"aproved"` can ever be inserted.
- Prisma generates TypeScript types from enums automatically — IDE autocomplete and compile-time safety throughout the codebase.
- Filtering by status (`WHERE status = 'APPROVED'`) is more performant than a `LIKE` on a free-text column.

---

## 4. Indexes

```prisma
model Submission {
  // ...
  @@index([studentId])       // speeds up "find my submission" lookup
  @@index([status])          // speeds up mentor dashboard status filter
  @@index([createdAt])       // speeds up default sort (newest first)
}
```

**Why these three:**
- `studentId` — every student submission lookup (`GET /submissions/me`) filters by this. Without an index, it's a full table scan.
- `status` — the mentor dashboard filter (`?status=APPROVED`) hits this column on every paginated query.
- `createdAt` — default sort is newest first. An index here avoids an in-memory sort on large datasets.

---

## 5. Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  STUDENT
  MENTOR
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  submissions Submission[]

  @@map("users")
}

model Submission {
  id          String           @id @default(uuid())
  projectName String
  repoUrl     String
  liveUrl     String?
  description String
  status      SubmissionStatus @default(PENDING)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  studentId String
  student   User   @relation(fields: [studentId], references: [id])

  @@index([studentId])
  @@index([status])
  @@index([createdAt])
  @@map("submissions")
}
```

---

## 6. Seed Script

The seed creates one Mentor account. This is the only way a Mentor user enters the system.

```ts
// prisma/seed.ts

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('mentor_password', 10)

  await prisma.user.upsert({
    where: { email: 'mentor@sikhbo.com' },
    update: {},
    create: {
      name: 'Sikhbo Mentor',
      email: 'mentor@sikhbo.com',
      password: hashedPassword,
      role: Role.MENTOR,
    },
  })

  console.log('Seed complete: Mentor account ready')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Why `upsert` instead of `create`?**
Running `prisma db seed` multiple times (e.g. after a DB reset) would throw a unique constraint error with a plain `create`. `upsert` is idempotent — it creates the mentor if missing, skips if already there.

---

## 7. Design Decisions

| Decision | Rationale |
|---|---|
| Single `User` model for both roles | Avoids join complexity for auth. Role field is sufficient to differentiate behavior. |
| UUID primary keys | No sequential enumeration. Safe to expose in API URLs. |
| One-to-one enforced at app layer, not DB | Produces a clean business error instead of a raw constraint violation message. |
| `status` defaults at DB level | Safety net — correct default even if service layer omits it. |
| `updatedAt` on Submission | Free audit trail for status changes without a separate history table. |
| `@@map` on both models | Table names in DB are lowercase plural (`users`, `submissions`), consistent with SQL conventions, while Prisma models stay PascalCase. |
