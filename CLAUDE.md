# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sistema de Gestión de Cobranzas — a debt collection CRM for call center environments. Manages debtors, debts with installments (cuotas), follow-ups (seguimientos), configurable state machines, and authorization workflows. Three roles: Gestor (operative), Supervisor (authorize/monitor), Administrador (configure).

## Commands

```bash
npm run dev              # Next.js dev server on port 3000
npm run build            # Production build
npm test                 # Run all tests (Vitest)
npm run test:coverage    # Tests with coverage report
npx vitest run src/domain/entities/deuda.test.ts  # Run a single test file
npx prisma migrate dev   # Run database migrations
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma studio        # Database GUI
npm run seed             # Seed database (tsx prisma/seed.ts)
```

## Architecture: Hexagonal (Ports & Adapters)

Strict dependency direction: **Infrastructure → Application → Domain** (never reverse).

### Domain (`src/domain/`)
Pure business logic with **zero external dependencies**. Contains entities, enums, repository interfaces (contracts only), domain services, and the AppError hierarchy. Entities use private constructors with two static factory methods:
- `crear(props)` — new instance with validation
- `reconstruir(props)` — hydrate from database without re-validation

Domain services: `ValidadorTransicionEstado`, `EvaluadorRegla`, `EvaluadorCondicion`, `AsignadorSupervisor`, `InteresAcumulador`.

### Application (`src/application/`)
Use cases that orchestrate domain entities and services. Dependencies injected via constructor. Each use case receives repository interfaces, not implementations.

### Infrastructure (`src/infrastructure/`)
Prisma repository implementations, middleware (`withErrorHandler`, `withRateLimit`), Pino logger, auth utilities. Prisma client singleton at `src/infrastructure/lib/prisma.ts`.

### API (`app/api/`)
Thin Next.js route handlers. Pattern: authenticate → validate (Zod) → execute use case → map errors → return response. No business logic here.

### UI (`app/dashboard/`, `components/`)
React 19 with Tailwind CSS 4 and shadcn/ui (Radix primitives). Dashboard pages under `app/dashboard/`.

## Tech Stack

- **Next.js 16** (App Router), **TypeScript 5** (strict), **React 19**
- **PostgreSQL 14+** with **Prisma 7.3** ORM
- **Vitest 4** for testing, **Zod 4.3** for validation, **Pino** for logging
- **NextAuth.js 4.24** for authentication (partially implemented)
- **Tailwind CSS 4**, **shadcn/ui**, **Lucide React**, **date-fns 4.1**

## Testing Conventions

- Test files co-located with source: `file.ts` → `file.test.ts`
- Domain entities require 100% unit test coverage
- Use cases tested with mocked repositories
- Infrastructure repositories tested as integration tests
- Vitest runs with `globals: true` (no need to import `describe`/`it`/`expect`)
- Test helpers in `src/__tests__/test-helpers.ts`: `crearCuotaPrueba()`, `crearDeudaPrueba()`, `crearDeudaConCuotas()`, `crearFecha()`, `avanzarDias()`
- Path alias `@/` maps to workspace root

## Error Handling

AppError hierarchy in `src/domain/errors/app-error.ts`:
- `ValidationError` (400), `NotFoundError` (404), `UnauthorizedError` (401)
- `ForbiddenError` (403), `ConflictError` (409), `InternalServerError` (500)

API routes use `withErrorHandler()` middleware for centralized error mapping to HTTP responses.

## Database

Schema in `prisma/schema.prisma`. Key models: `Persona`, `DeudaMaestra`, `Cuota`, `Seguimiento`, `EstadoDeuda`, `ReglaTransicion`, `TransicionEstado`, `SolicitudAutorizacion`, `TipoGestion`, `Usuario`, `AsignacionCartera`. Generated client output at `src/generated/client/` — never edit manually.

## Key Domain Concepts

- **Debt state machine**: States (EstadoDeuda) with configurable transitions (TransicionEstado). Some transitions require supervisor authorization (SolicitudAutorizacion).
- **Transition rules** (ReglaTransicion): When a seguimiento with a specific TipoGestion is created, rules evaluate conditions against debt context to determine automatic state changes.
- **Daily batch processing**: `ActualizarDeudasDiariamenteUseCase` recalculates diasMora, diasGestion, interest accruals, and totals.
- **Cuotas**: Installments with independent states (Pendiente, Vencida, Pagada, En_Acuerdo) and interest accumulation.

## Language

The domain, API messages, error messages, and documentation are in **Spanish**. Code identifiers (entity names, methods, variables) use Spanish. Keep this convention.

## Configuration

Environment variables validated via Zod in `src/config/index.ts`. Required: `DATABASE_URL`, `JWT_SECRET` (min 32 chars). See `.env.example` for all variables.
