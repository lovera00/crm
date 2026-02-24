# AGENTS.md - CRM Cobranzas

## Build, Lint, and Test Commands

### Development
```bash
npm run dev          # Start Next.js development server
```

### Build
```bash
npm run build        # Build Next.js application
npm run start        # Start production server
```

### Testing
```bash
npm test             # Run all tests with Vitest (watch mode)
npm test -- --run    # Run tests once (CI mode)
npm test -- path/to/file.test.ts   # Run single test file
npm test -- -t "test name"          # Run single test by name
npm test:coverage                   # Run tests with coverage report
```

### Database
```bash
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
npm run seed          # Seed database
```

---

## Code Style Guidelines

### General Principles
- This is a **Next.js 16** application with TypeScript (strict mode)
- Uses **domain-driven design** with use-cases, entities, and repositories
- **Spanish** is used for domain naming (persona, deuda, solicitud)
- **English** is used for technical terms (useCase, repository, interface)

### Project Structure
```
src/
  application/use-cases/    # Business logic (use-cases)
  domain/
    entities/                # Domain entities (Persona, Deuda, etc.)
    repositories/           # Repository interfaces
    enums/                  # Domain enums (EstadoDeuda, etc.)
app/                        # Next.js App Router pages
components/                 # React components (UI and feature components)
lib/                        # Utilities and configurations
```

### TypeScript Guidelines

#### Strict Mode Enabled
- All TypeScript strict checks are enabled in `tsconfig.json`
- Never use `any` unless absolutely necessary (use `unknown` instead)
- Prefer explicit types over inference for function parameters

#### Type Definitions
```typescript
// Use interfaces for public APIs (extendable)
export interface CrearPersonaInput {
  nombres: string;
  apellidos: string;
  documento: string;
}

// Use types for unions, tuples, and readonly
type Status = 'pending' | 'completed';
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `crear-persona.ts`, `persona-repository.ts` |
| Test files | Same as source + `.test.ts` | `crear-persona.test.ts` |
| Classes | PascalCase | `CrearPersonaUseCase`, `Persona` |
| Functions | camelCase | `buscarPorDocumento()`, `execute()` |
| Variables | camelCase | `personaRepository`, `input` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Enums | PascalCase with UPPER values | `EstadoDeuda.EN_GESTION` |
| Interfaces | PascalCase | `CrearPersonaInput` |

### Imports

#### Order (分组顺序)
1. Built-in Node.js imports
2. External libraries (next, react, prisma)
3. Internal absolute imports (`@/`)
4. Relative imports (domain, application)
5. Type imports

```typescript
// Correct
import { useState } from 'react';
import { NextRequest } from 'next/server';
import { PersonaRepository } from '@/domain/repositories/persona-repository';
import { Persona } from '@/domain/entities/persona';
import type { CrearPersonaInput } from './crear-persona';
```

#### Use path aliases
- Use `@/` for absolute imports from project root
- Configure in `tsconfig.json`: `"@/*": ["./*"]`

### React/Next.js Guidelines

#### Components
- Use functional components with TypeScript
- Use `async` for server components
- Use `'use client'` directive for client components
- Export components as default or named (prefer named for organization)

```typescript
// Server Component
export default async function DashboardPage() {
  // ...
}

// Client Component
'use client';
import { useState } from 'react';

export function SearchInput() {
  const [query, setQuery] = useState('');
  // ...
}
```

#### Props
- Define props types with interfaces
- Use `Readonly<Props>` for immutable props when needed

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}
```

### Error Handling

#### Use Error class for domain errors
```typescript
// In use-cases
if (existente) {
  throw new Error(`Ya existe una persona con documento ${input.documento}`);
}
```

#### Use Try/Catch for external operations
```typescript
try {
  await this.personaRepository.guardar(persona);
} catch (error) {
  throw new Error(`Error al guardar persona: ${error.message}`);
}
```

### Testing Guidelines

#### Test File Location
- Co-locate tests with source files: `crear-persona.ts` → `crear-persona.test.ts`

#### Test Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CrearPersonaUseCase', () => {
  let personaRepository: PersonaRepository;
  let useCase: CrearPersonaUseCase;

  beforeEach(() => {
    // Setup mocks
    personaRepository = {
      buscarPorDocumento: vi.fn(),
      guardar: vi.fn(),
    };
    useCase = new CrearPersonaUseCase(personaRepository);
  });

  it('should create a person successfully', async () => {
    // Arrange
    vi.mocked(personaRepository.buscarPorDocumento).mockResolvedValue(null);
    
    // Act
    const output = await useCase.execute(input);
    
    // Assert
    expect(output.personaId).toBe(100);
  });
});
```

#### Test Naming (Spanish)
- Use Spanish for test descriptions following "debería..." pattern
- Example: `it('debería crear una persona exitosamente', ...)`

### UI Components (shadcn/ui)

#### Using shadcn components
- Components are in `components/ui/`
- Use the `cn()` utility for merging classes

```typescript
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export function MyComponent({ className }: { className?: string }) {
  return (
    <div className={cn('base-classes', className)}>
      Content
    </div>
  );
}
```

### Database (Prisma)

#### Schema
- Define models in `prisma/schema.prisma`
- Use proper relations and indexes

#### Repository Pattern
- Implement repository interfaces from `domain/repositories/`
- Keep database logic in repository implementations

---

## Common Patterns

### Use Case Pattern
```typescript
export class CrearPersonaUseCase {
  constructor(private personaRepository: PersonaRepository) {}

  async execute(input: CrearPersonaInput): Promise<CrearPersonaOutput> {
    // 1. Validate input
    // 2. Business logic
    // 3. Persist
    // 4. Return output
  }
}
```

### Entity Pattern (Domain-Driven)
```typescript
export class Persona {
  private props: PersonaProps;
  
  static crear(data: PersonaData): Persona {
    // Factory method with validation
  }
  
  get id(): number | undefined {
    return this.props.id;
  }
}
```

---

## Additional Notes

- No ESLint or Prettier configuration found - follow TypeScript strict mode
- Tests use Vitest with `vi.fn()` for mocking
- Environment variables are in `.env.local` (never commit secrets)
- Uses SQLite for development, PostgreSQL for production
