# Sistema de Gestión de Cobranzas

Sistema integral de gestión de cobranzas para entornos de call center, desarrollado con Next.js 16 (App Router), TypeScript, PostgreSQL y Prisma, aplicando Arquitectura Hexagonal (Ports & Adapters), DDD light y TDD.

## Características principales

- Gestión completa de deudores, codeudores y referencias
- Sistema de deudas con cuotas y máquina de estados configurables
- Registro detallado de seguimientos con impacto automático en estados
- Sistema de reglas de negocio configurable por administradores
- Roles diferenciados: Gestor, Supervisor, Administrador
- Cálculos automáticos diarios (mora, gestión, totales)

## Arquitectura

El sistema sigue una arquitectura hexagonal con las siguientes capas:

### 1. Dominio (`src/domain`)
- Entidades puras (Deuda, Cuota, Seguimiento, ReglaTransicion, etc.)
- Value Objects, Enums, Errores de dominio
- Interfaces de repositorio
- Lógica de negocio 100% testeable sin dependencias externas

### 2. Aplicación (`src/application`)
- Casos de uso (CrearSeguimiento, CambiarEstadoDeuda, etc.)
- DTOs y puertos (interfaces)
- Manejo de permisos por rol y errores tipados

### 3. Infraestructura (`src/infrastructure`)
- Adaptadores Prisma para repositorios
- Clock inyectable y servicios de email/notificaciones
- Configuración de base de datos

### 4. API (`app/api`)
- Rutas Next.js delgadas (solo autenticación, parsing, ejecución de casos de uso)
- Mapeo de errores a respuestas HTTP

### 5. UI (`app`)
- Componentes React con Tailwind CSS
- Dashboard, fichas de persona, creación de seguimientos

## Tecnologías

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Arquitectura Hexagonal
- **Base de datos**: PostgreSQL con Prisma ORM
- **Testing**: Vitest (100% cobertura en dominio), Playwright (E2E)
- **Autenticación**: NextAuth.js (pendiente)

## Estado actual del desarrollo

✅ **Completado:**
- Configuración inicial del proyecto Next.js con TypeScript y Tailwind
- Esquema completo de base de datos PostgreSQL con Prisma
- Generación del cliente Prisma
- Configuración de Vitest para testing
- Entidades de dominio: Deuda, Cuota, Seguimiento, ReglaTransicion
- Enums: EstadoDeuda, EstadoCuota
- Repositorios de dominio (interfaces)
- Caso de uso: CrearSeguimiento
- Adaptadores de infraestructura (Prisma)
- API Route POST /api/seguimientos

⏳ **En progreso:**
- Tests de dominio al 100% de cobertura
- Implementación completa de máquina de estados
- Cálculos automáticos (días de mora, días de gestión, totales)
- Sistema de autorizaciones
- UI con componentes React
- Autenticación con NextAuth.js
- Tests E2E con Playwright

## Instalación y configuración

### Requisitos previos
- Node.js 18+ 
- PostgreSQL 14+ (o Docker)

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone <url>
   cd crm
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con DATABASE_URL apropiado
   ```

4. **Ejecutar migraciones de base de datos**
   ```bash
   npx prisma migrate dev
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

6. **Ejecutar tests**
   ```bash
   npm test
   npm run test:coverage
   ```

## Estructura de carpetas

```
crm/
├── app/                    # Next.js App Router
│   ├── api/               # Rutas API
│   └── (pages UI)         # Componentes de UI
├── src/
│   ├── domain/            # Dominio (entidades, value objects, repositorios)
│   ├── application/       # Casos de uso, DTOs, puertos
│   ├── infrastructure/    # Adaptadores (Prisma, servicios externos)
│   └── shared/           # Utilidades compartidas
├── prisma/               # Esquema y migraciones
├── tests/               # Tests de integración y E2E
└── docs/               # Documentación (REQUERIMIENTOS.md)
```

## Próximos pasos

1. Completar tests de dominio al 100% de cobertura
2. Implementar máquina de estados con validación de transiciones
3. Desarrollar sistema de autorizaciones (aprobación/rechazo)
4. Crear UI completa con Tailwind CSS
5. Implementar autenticación con NextAuth.js y roles
6. Desarrollar dashboard de supervisor
7. Configurar actualización diaria automática (cron job)
8. Escribir tests E2E con Playwright

## Decisiones técnicas

- **Arquitectura Hexagonal**: Separación clara de responsabilidades, dominio independiente
- **DDD light**: Agregados, entidades, value objects, repositorios
- **TDD estricto**: Tests escritos antes del código productivo
- **Prisma**: ORM type-safe con migraciones automáticas
- **Next.js App Router**: Server-side rendering, API routes integradas
- **Tailwind CSS**: Estilos utilitarios para desarrollo rápido

## Licencia

Proyecto interno para gestión de cobranzas.
