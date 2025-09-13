# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack monorepo demonstrating **end-to-end type safety** between a NestJS backend and Next.js frontend using tRPC, with auto-generated Swagger documentation from Zod schemas. The project serves as both a demo and a starter template for building modern full-stack applications.

## Architecture

- **Monorepo Structure**: pnpm workspaces with apps and packages
- **Backend**: NestJS with tRPC and REST endpoints at `apps/api/`
- **Frontend**: Next.js App Router with tRPC client at `apps/web/`
- **Shared Packages**: Common types and utilities in `packages/`

## Key Commands

### Development
- `pnpm dev` - Start both API (port 3001) and web app (port 3000) concurrently
- `pnpm dev:api` - Start only the NestJS API server
- `pnpm dev:web` - Start only the Next.js frontend

### Building & Testing
- `pnpm build` - Build all packages and apps
- `pnpm build:packages` - Build only the packages
- `pnpm build:apps` - Build only the apps
- `pnpm test` - Run API tests (Jest)
- `pnpm test:watch` - Run API tests in watch mode

### Code Quality
- `pnpm lint` - Lint all apps
- `pnpm lint:fix` - Lint and auto-fix issues

## Key Technologies & Patterns

### Schema-Driven Development
- **Zod schemas** are the single source of truth for validation and types
- Custom `@zQuery` and `@zParam` decorators validate query/path parameters
- `nestjs-zod` generates NestJS DTOs from Zod schemas for Swagger
- All API responses follow consistent wrapper format via `wrapResponse()`

### tRPC Integration
- Backend router at `apps/api/src/modules/trpc/trpc.router.ts`
- Frontend client at `apps/web/src/app/_trpc/client.ts`
- Type inference flows from backend to frontend automatically
- tRPC routes are mounted at `/trpc` endpoint

### Rate Limiting Architecture
- **REST API**: Protected by `CustomThrottlerGuard` (global APP_GUARD) with NestJS throttler
- **tRPC**: Protected by tRPC middleware in `apps/api/src/modules/trpc/trpc.middleware.ts`
- **User-based tracking**: Authenticated users tracked by `userId`, unauthenticated by IP
- **Procedure-specific limits**: Different rate limits for different operation types:
  - `publicProcedure`: IP-based, 1000 req/min (for public endpoints)
  - `authProcedure`: User/IP-based, 10 req/15min (for auth operations)
  - `authenticatedRateLimitedProcedure`: User-based, 100 req/min (standard)
  - `authenticatedStrictProcedure`: User-based, 5 req/min (sensitive operations)
  - `burstProtectedProcedure`: 10 req/sec (high-frequency endpoints)

### Swagger Documentation
- Auto-generated from Zod schemas and NestJS decorators
- Available at `/docs` in development
- YAML exported to `apps/api/swagger.yml` for external tools
- Uses custom `ApiResponseDto()` and `ApiResponseListDto()` utilities for consistent response shapes

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based authorization using `@Roles()` decorator and `RolesGuard`
- Guards applied globally: `AuthGuard` and `RolesGuard`

## Code Organization

### Backend Structure (`apps/api/src/`)
- `common/` - Shared utilities, DTOs, decorators, guards, interceptors
- `modules/` - Feature modules (cars, auth, users, trpc, config)
- `main.ts` - Application bootstrap with CORS, versioning, middleware setup

### Frontend Structure (`apps/web/src/`)
- `app/` - Next.js App Router pages and layouts
- `app/_components/` - Reusable React components
- `app/_trpc/` - tRPC client setup and provider
- **Frontend Vision**: Building towards a state-of-the-art Next.js application using tRPC with TanStack Query for optimal data fetching and caching
- **Styling**: TailwindCSS for utility-first styling (note: currently transitioning from Ant Design)

### Shared Packages (`packages/`)
- `shared/` - Common types and enums (e.g., `CarBrand`)
- `logging/` - Shared logging utilities

## Communication Style

**IMPORTANT**: Keep task completion summaries very short (1-2 sentences max). User has limited time to read lengthy summaries.

## App-Specific Guidelines

For detailed development guidelines specific to each application, see:
- **API Development**: `apps/api/CLAUDE.md` - NestJS patterns, testing requirements, rate limiting
- **Frontend Development**: `apps/web/CLAUDE.md` - Next.js patterns, tRPC client usage, styling guidelines

## Development Notes

### Adding New Features
1. Define Zod schemas in the appropriate module's `dto/` folder
2. Create NestJS DTOs using `createZodDto(schema)`
3. Add REST controllers with proper Swagger decorations
4. Add corresponding tRPC procedures in the router (if meant for the web)
5. Write comprehensive tests for all new functionality
6. Run tests to verify implementation works correctly
7. Update frontend to consume new tRPC procedures using TanStack Query patterns

### Database/State Management
- No database is configured - uses in-memory storage for demo purposes
- Services implement CRUD operations with filtering and pagination
- Adapters convert between internal models and DTOs

### Error Handling
- Global `HttpErrorFilter` catches and formats exceptions
- Zod validation errors are automatically handled by `ZodValidationPipe`
- Custom decorators like `@BadRequest()` provide consistent error documentation

### Environment Configuration
- Environment-specific behavior in `main.ts` and `setup-swagger.ts`
- Development mode enables Swagger UI and enhanced logging
- Production mode serves only YAML spec for external integration
