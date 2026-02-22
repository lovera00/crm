# Project Structure

## Architecture Pattern

The project follows **Hexagonal Architecture (Ports & Adapters)** with Domain-Driven Design (DDD) principles and Test-Driven Development (TDD).

## Directory Organization

### `/src` - Core Application Code

#### `/src/domain` - Domain Layer (Pure Business Logic)
- **`/entities`**: Domain entities with business logic (Deuda, Cuota, Seguimiento, Persona, etc.)
  - Each entity has a corresponding `.test.ts` file
  - Entities are immutable with factory methods: `crear()` and `reconstruir()`
  - Use private constructors and getters for encapsulation
- **`/enums`**: Domain enumerations (EstadoDeuda, EstadoCuota, EstadoSolicitud, etc.)
- **`/repositories`**: Repository interfaces (contracts, no implementation)
- **`/services`**: Domain services for complex business logic (ValidadorTransicionEstado, EvaluadorRegla, AsignadorSupervisor, etc.)
- **`/value-objects`**: Value objects (if any)
- **`/errors`**: Domain-specific error classes (AppError hierarchy)
- **`/events`**: Domain events (if any)

**Rule**: Domain layer has ZERO external dependencies. 100% testable without infrastructure.

#### `/src/application` - Application Layer (Use Cases)
- **`/use-cases`**: Application use cases (CrearSeguimiento, ActualizarDeudasDiariamente, etc.)
  - Each use case has a corresponding `.test.ts` file
  - Use cases orchestrate domain entities and services
  - Input/Output DTOs defined inline or in separate files
- **`/dtos`**: Data Transfer Objects (if separated)
- **`/ports`**: Port interfaces for external services (if any)

#### `/src/infrastructure` - Infrastructure Layer (Adapters)
- **`/repositories`**: Prisma repository implementations
  - Implement domain repository interfaces
  - Handle ORM mapping between Prisma models and domain entities
  - Each repository has a corresponding `.test.ts` file
- **`/services`**: External service implementations (CronJobService, etc.)
- **`/lib`**: Infrastructure utilities (Prisma client singleton)
- **`/logging`**: Logging configuration (Pino logger)
- **`/middleware`**: Infrastructure middleware (rate-limiter, error-handler)
- **`/auth`**: Authentication utilities and middleware

#### `/src/config` - Configuration
- Environment variable validation with Zod
- Centralized configuration management

#### `/src/generated` - Prisma Generated Code
- Auto-generated Prisma client and types
- **DO NOT EDIT MANUALLY**
- Regenerate with `npx prisma generate`

#### `/src/__tests__` - Shared Test Utilities
- Test helpers and fixtures
- Shared test setup

### `/app` - Next.js App Router

#### `/app/api` - API Routes
- RESTful API endpoints
- Thin controllers: authentication, validation, use case execution, error mapping
- Organized by resource: `/personas`, `/deudas`, `/seguimientos`, `/autorizaciones`
- Each resource may have nested routes (e.g., `/deudas/[id]`)

#### `/app/dashboard` - Dashboard Pages
- Server-side rendered pages
- Protected routes with authentication
- Organized by feature: `/personas`, `/deudas`, `/autorizaciones`

#### `/app/auth` - Authentication Pages
- Login, logout, etc.

#### `/app` - Root Layout & Pages
- `layout.tsx`: Root layout with providers
- `page.tsx`: Home/landing page
- `globals.css`: Global styles

### `/components` - React Components
- **`/ui`**: Reusable UI components (shadcn/ui)
- Shared components like Navbar, Sidebar

### `/prisma` - Database Schema & Migrations
- `schema.prisma`: Database schema definition
- `/migrations`: Migration history (auto-generated)
- `seed.ts`: Database seeding script

### `/docs` - Documentation
- `REQUERIMIENTOS.md`: Complete functional specification
- `api.md`: API documentation

### `/scripts` - Utility Scripts
- Deployment scripts
- Database maintenance scripts

### `/public` - Static Assets
- Images, icons, fonts

## File Naming Conventions

- **Entities**: PascalCase (e.g., `deuda.ts`, `seguimiento.ts`)
- **Tests**: Same name with `.test.ts` suffix (e.g., `deuda.test.ts`)
- **API Routes**: `route.ts` in feature folders
- **Pages**: `page.tsx` in feature folders
- **Components**: kebab-case for files, PascalCase for exports (e.g., `navbar.tsx` exports `Navbar`)

## Import Aliases

- `@/` maps to workspace root (configured in `tsconfig.json`)
- Example: `import { Deuda } from '@/src/domain/entities/deuda'`

## Testing Strategy

- **Domain entities**: 100% unit test coverage required
- **Use cases**: Unit tests with mocked repositories
- **Repositories**: Integration tests with test database
- **API routes**: Integration tests (planned with Playwright)
- Test files co-located with source files

## Key Architectural Rules

1. **Domain Independence**: Domain layer never imports from application or infrastructure
2. **Dependency Direction**: Infrastructure → Application → Domain (never reverse)
3. **Repository Pattern**: All data access through repository interfaces
4. **Entity Reconstruction**: Use `reconstruir()` for hydrating from database, `crear()` for new instances
5. **Immutability**: Entities expose getters, mutations through methods that maintain invariants
6. **Error Handling**: Use domain-specific errors (AppError hierarchy)
7. **Validation**: Zod schemas for API input validation, domain logic for business rules
