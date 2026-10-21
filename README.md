# Sikhbo Engine

A project submission and review platform for educational use. Students submit their capstone projects via GitHub URL, and mentors review, approve, or reject them through a dedicated dashboard.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js v5
- **ORM**: Prisma v7
- **Database**: PostgreSQL
- **Auth**: JWT + bcryptjs
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string to a remote instance)

## Getting Started

**1. Clone and install dependencies**

```bash
npm install
```

**2. Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sikhbo"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
```

**3. Run database migrations**

```bash
npx prisma migrate dev
```

**4. Seed the database**

This creates the initial Mentor account (mentors cannot self-register).

```bash
npm run seed
```

**5. Start the development server**

```bash
npm run dev
```

The API will be available at `http://localhost:5000/api/v1`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Generate Prisma client and compile TypeScript |
| `npm start` | Run the compiled production build |
| `npm run seed` | Seed the Mentor account into the database |

## Roles

| Role | Access |
|---|---|
| `STUDENT` | Self-register, submit projects, view own submissions |
| `MENTOR` | View all submissions, approve/reject, view stats — seeded only |

## API Overview

Base URL: `/api/v1`  
Auth: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new student account |
| `POST` | `/auth/login` | Public | Login for students and mentors |

### Student

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/submissions` | Student | Submit a project (rate limited: 5 req / 15 min) |
| `GET` | `/submissions` | Student | Get all own submissions |

### Mentor

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/mentor/submissions` | Mentor | List all submissions with pagination and filters |
| `GET` | `/mentor/submissions/stats` | Mentor | Get aggregated stats (total, pending, approved, rejected) |
| `PATCH` | `/mentor/submissions/:id/status` | Mentor | Approve or reject a submission |

For full request/response shapes see [`docs/api.md`](./docs/api.md).

## Project Structure

```
src/
├── config/          # Environment and Prisma client setup
├── constants/       # Shared message strings
├── controllers/     # HTTP layer — parse request, call service, respond
├── middlewares/     # authenticate, authorize, validate, rateLimiter, errorHandler
├── routes/          # Route definitions
├── services/        # Business logic
├── types/           # Express type extensions
├── utils/           # JWT, bcrypt, logger helpers
├── validations/     # Zod schemas
├── app.ts           # Express app setup
└── server.ts        # Server bootstrap
prisma/
├── schema.prisma    # Database models
└── seed.ts          # Mentor account seeder
```

## Docs

- [`docs/prd.md`](./docs/prd.md) — Product requirements
- [`docs/api.md`](./docs/api.md) — Full API contract
- [`docs/arch.md`](./docs/arch.md) — Architecture and design decisions
- [`docs/database.md`](./docs/database.md) — Database schema notes
