# Technology Stack

## Core Technologies

- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5 (strict mode enabled)
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 7.3.0
- **Testing**: Vitest 4.0 with coverage-v8
- **Authentication**: NextAuth.js 4.24
- **Logging**: Pino with structured logging
- **Validation**: Zod 4.3

## Frontend Stack

- **UI Framework**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Date Handling**: date-fns 4.1

## Development Tools

- **Package Manager**: npm
- **Database Client**: better-sqlite3 (dev), pg (production)
- **Process Runner**: tsx for TypeScript execution
- **Containerization**: Docker & Docker Compose

## Common Commands

### Development
```bash
npm run dev              # Start Next.js dev server (port 3000)
npm run build            # Build for production
npm start                # Start production server
```

### Database
```bash
npx prisma migrate dev   # Run migrations in development
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio GUI
npm run seed             # Seed database with initial data
```

### Testing
```bash
npm test                 # Run all tests with Vitest
npm run test:coverage    # Run tests with coverage report
```

### Docker
```bash
docker-compose up -d     # Start all services (dev mode)
docker build -t crm .    # Build production image
```

## Environment Configuration

The project uses environment-specific configuration files:
- `.env.development` - Development settings
- `.env.test` - Test environment
- `.env.production` - Production settings
- `.env.local` - Local overrides (not committed)

Required environment variables are validated using Zod schemas in `src/config/index.ts`.

## Database Schema Generation

Prisma generates TypeScript types to `src/generated/` directory. This folder should not be manually edited. Regenerate after schema changes with `npx prisma generate`.

## Build Output

- Next.js builds to `.next/` directory
- TypeScript compilation info in `tsconfig.tsbuildinfo`
- Coverage reports in `coverage/` (gitignored)
