# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context

`nestjs-volako-api` is the **NestJS 11 backend** of **Volako**, a French double-entry accounting app
(*comptabilité, Plan Comptable Général*). Stack: NestJS 11 + Prisma 7 (PostgreSQL via `@prisma/adapter-pg`)
+ JWT auth. The Angular frontend is in `../ng-volako`; the full stack runs via `../docker-compose.yml`.

## Commands

```bash
npm run start:dev   # watch-mode dev server (http://localhost:3000)
npm run build       # nest build → dist/
npm run start:prod  # node dist/main
npm run lint        # eslint --fix
npm test            # Jest unit tests (*.spec.ts under src/)
npm run test:cov    # with coverage (thresholds enforced, see below)
npm run test:e2e    # e2e tests (test/*.e2e-spec.ts)
npm run seed        # seed PCG + demo data (prisma/seed.ts)

npx prisma migrate dev --name <name>   # create + apply a migration (dev)
npx prisma migrate deploy              # apply migrations (prod / CI)
npx prisma generate                    # regenerate the client after schema edits
```

## Environment

Required env vars (loaded via `dotenv` in `main.ts`):

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — **mandatory**; the process exits at boot if unset
- `FRONTEND_URL` — CORS origin (default `http://localhost:4200`)
- `PORT` (default 3000), `NODE_ENV`

> Note: `env.template` is stale (references `wallet_db` and omits `JWT_SECRET`). Use the list above.

## Architecture — Clean / Hexagonal (the core convention)

Every feature lives under `src/modules/<feature>/` and is split into **four layers**. This is applied
consistently across all ~26 modules — match it exactly when adding code.

```
modules/<feature>/
├── domain/                          # pure business entities (no Nest, no Prisma)
│   └── entities/*.entity.ts
├── application/
│   ├── ports/
│   │   ├── *.repository.interface.ts   # repository contract (interface)
│   │   └── *.repository.token.ts       # string DI token, e.g. 'ACCOUNTS_REPOSITORY'
│   └── use-cases/
│       ├── <verb>_<noun>.usecase.ts    # ONE use-case per file, @Injectable
│       └── *.usecases.spec.ts          # unit tests (mock the repository port)
├── infrastructure/
│   └── repositories/db.<feature>.repository.ts   # Prisma implementation of the port
└── interface/
    ├── <feature>.controller.ts         # thin: delegates to use-cases
    └── dtos/*.dto.ts                    # class-validator DTOs
```

**Dependency inversion**: use-cases depend on the repository **interface**, injected by token, never
on Prisma directly. Wiring lives in `<feature>.module.ts`:

```ts
providers: [
  CreateAccountUseCase, FindAccountsUseCase, /* … */,
  { provide: ACCOUNTS_REPOSITORY, useClass: DbAccountRepository },
],
exports: [ACCOUNTS_REPOSITORY],   // export the token if another module needs it
```

Controllers are thin — they receive the `userId` from the JWT and call a use-case. Example:

```ts
@Post()
createOperation(@Body() dto: CreateOperationDto, @CurrentUser() userId: number) {
  return this.createOperationUseCase.execute(dto, userId);
}
```

## Multi-tenancy (important)

Data is **scoped per user**. The `userId` comes from the JWT via the `@CurrentUser()` param decorator
(reads `request.user.id`) and is threaded use-case → repository → every Prisma query (`where: { userId }`).

⚠️ The Prisma schema has `userId Int @default(1)` on many models — this is only a **seed convenience
default**, NOT the security boundary. Never rely on it; always pass and filter by the authenticated
`userId` in queries.

## Auth & guards (`src/common/`)

- `JwtAuthGuard` — reads the token from the **httpOnly `access_token` cookie first**, falls back to a
  `Bearer` header. Rejects disabled accounts. Sets `request.user = { id, email, role }`.
- `RolesGuard` + `@Roles(...)` decorator + `ROLES_KEY` metadata — RBAC. Roles enum:
  `ADMIN, DAF, CHEF_COMPTABLE, COMPTABLE, ASSISTANT, AUDITEUR`.
- `@CurrentUser()` / `@CurrentRole()` param decorators.
- Guards are applied **per controller** via `@UseGuards(JwtAuthGuard[, RolesGuard])` — they are NOT
  global. ⚠️ A new controller without `@UseGuards` is **public**; always add the guard.
- `AuthController` issues httpOnly cookies (`access_token` 15 min, `refresh_token` 7 d), supports
  refresh, logout (revokes refresh token), password change, and **2FA TOTP** (temp_token → verify).

## Cross-cutting (`src/common/`, wired in `app.module.ts`)

- `ThrottlerGuard` registered as a global `APP_GUARD` (300 req/min; login is further limited to 5/min).
- `CacheModule` (global, 5-min TTL).
- `CorrelationIdMiddleware` (applied to all routes) + `StructuredLoggerService` + `LoggingInterceptor`.
- `MonitoringModule` — health / metrics endpoints + `MetricsInterceptor`.
- `AuditLogService` for audit trail; `BackupService`, `RelancesSchedulerService`, recurring-entry
  scheduler use `@nestjs/schedule`.

## Bootstrap (`main.ts`)

`cookie-parser`, CORS with `credentials: true` scoped to `FRONTEND_URL`,
`ValidationPipe({ whitelist: true })` (strips unknown DTO props), and **Swagger at `/api/docs`** —
enabled **only when `NODE_ENV !== 'production'`**.

## Prisma (`prisma/`)

- `PrismaService` extends `PrismaClient` using the `PrismaPg` adapter over a `pg.Pool`; verbose query
  logs in dev only. Imported via `PrismaModule`.
- `schema.prisma` — domain incl. accounting (Account/Operation/JournalEntry/JournalLine with lettrage
  + `codeTva`), Journals + sequences, TVA declarations, immobilisations + amortissement, analytique,
  bank reconciliation (ReleveImport/LigneReleve), PSD2 (CompteBank), recurring entries, RGPD requests,
  fiscal years, period locks, invoices/payments, audit log, 2FA fields.
- Money is stored as **`Int`** (integer minor units). Some schema comments say "centimes"; note the
  frontend now renders amounts as whole units of a configurable currency — keep that mismatch in mind.
- `prisma/pcg-data.ts` holds the French Plan Comptable Général seed; `prisma/seed.ts` seeds it.

## Testing

- Jest, `testRegex: .*\.spec\.ts$`, root `src/`. Coverage thresholds are **enforced**:
  statements 70 / branches 60 / functions 70 / lines 70. Repositories, controllers, DTOs, modules and
  some infra are excluded from coverage (see `jest.collectCoverageFrom` in `package.json`).
- Test the **use-cases** (the business logic) by mocking the repository port — that is where coverage
  comes from. e2e tests live in `test/*.e2e-spec.ts` and run against a real Postgres (see `../.github/workflows/ci.yml`).

## Adding a new feature module (checklist)

1. `domain/entities/` — the entity.
2. `application/ports/` — repository interface + `*.repository.token.ts`.
3. `application/use-cases/` — one file per use-case (+ `.spec.ts`).
4. `infrastructure/repositories/db.<feature>.repository.ts` — Prisma impl, always filter by `userId`.
5. `interface/` — controller (`@UseGuards(JwtAuthGuard)`, `@CurrentUser()`) + DTOs.
6. `<feature>.module.ts` — wire providers + `{ provide: TOKEN, useClass: ... }`, export the token if reused.
7. Register the module in `app.module.ts`.
8. If the schema changed: `prisma migrate dev` + `prisma generate`.
