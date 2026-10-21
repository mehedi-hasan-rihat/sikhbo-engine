# Sikhbo Engine — Agent Context

## What This Project Is
Backend for a project submission and review platform. Students submit projects, mentors review and approve/reject them. Express.js + TypeScript + Prisma + PostgreSQL.

## Key Docs
| File | What it covers |
|---|---|
| `docs/prd.md` | Business rules, feature requirements, ambiguity decisions |
| `docs/arch.md` | Tech stack, folder structure, middleware chain, patterns |
| `docs/api.md` | All endpoints, request/response shapes, status codes |
| `docs/database.md` | Prisma schema, models, indexes, seed script |
| `docs/workplan.md` | Phase-by-phase task list with completion status |

## Hard Rules
1. Controllers never touch Prisma — services only
2. All business logic lives in services
3. Throw typed errors from services — no try/catch in controllers
4. Middleware order: `rateLimiter` → `authenticate` → `authorize(role)` → `validate(schema)` → controller
5. No inline string literals — use `src/constants/messages.ts`
6. No raw SQL — Prisma only
7. Env vars only via `env` object from `src/config/env.ts`

## Response Shape
```ts
{ success: true,  message: string, data: object }
{ success: false, message: string, errors?: Record<string, string> }
```

## Dev Commands
```bash
npm run dev                            # nodemon + tsx hot reload
npx prisma migrate dev --name <name>   # run migration
npx prisma db seed                     # seed mentor account
npx prisma studio                      # DB GUI
```
