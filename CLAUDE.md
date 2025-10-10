# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CarHub** is a **demonstration project** showcasing modern full-stack patterns with **end-to-end type safety** between a NestJS backend and Next.js frontend using tRPC. The project highlights advanced Swagger documentation generation from Zod schemas and serves as an **inspiration source** for building production-ready applications.

## Architecture

- **Monorepo Structure**: pnpm workspaces with apps and packages
- **Backend**: NestJS API with REST endpoints + tRPC at `apps/api/`
- **Frontend**: Next.js App Router with tRPC client at `apps/web/` *(in development)*
- **Shared Packages**: Common types and utilities in `packages/`

## Key Commands

### Development
- `pnpm dev` - Start both API (port 3001) and web app (port 3000) concurrently
- `pnpm dev:api` - Start only the NestJS API server
- `pnpm dev:web` - Start only the Next.js frontend

### Database
- `pnpm --filter api seed` - Seed database with sample data
- `pnpm --filter api migrations:run` - Run database migrations
- `pnpm --filter api schema:drop` - Drop all database tables

### Building & Testing
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run API tests (Jest)
- `pnpm test:cov` - Run API tests with coverage

### Code Quality
- `pnpm lint` - Lint all apps
- `pnpm lint:fix` - Lint and auto-fix issues

## Demonstrated Technologies & Patterns

### Schema-First Development with Zod
- **Single Source of Truth**: Zod schemas drive validation, types, and documentation
- **Custom Decorators**: `@zQuery` and `@zParam` for validated parameters
- **Auto-Generated DTOs**: `nestjs-zod` creates NestJS DTOs from Zod schemas
- **Swagger Integration**: Automatic OpenAPI documentation from schemas

### Dual API Architecture
- **REST API**: Full OpenAPI/Swagger documentation for external integrations
- **tRPC**: Type-safe procedures for frontend with automatic type inference
- **Consistent Data**: Both APIs serve identical data with shared business logic

### Advanced NestJS Features
- **Custom Guards**: JWT authentication, role-based authorization, rate limiting
- **Error Handling**: Centralized error system with proper HTTP status codes
- **Interceptors**: Response formatting and request/response logging
- **Middleware**: Context management and rate limiting

### Database Integration
- **TypeORM**: PostgreSQL integration with proper entity relationships
- **Migrations**: Schema versioning and management
- **Seeding**: Comprehensive sample data including users, manufacturers, models, and cars
- **Relationships**: Proper foreign keys and cascading operations

### Security & Performance
- **JWT Authentication**: Access and refresh token system
- **Rate Limiting**: Tiered rate limiting (public, authenticated, strict, burst protection)
- **Input Validation**: All inputs validated through Zod schemas
- **CORS Configuration**: Proper frontend integration setup

## API Features Highlighted

### RESTful Endpoints
- **Authentication**: Login, logout, refresh tokens
- **User Management**: CRUD operations with role-based access
- **Car Management**: Full CRUD for cars, manufacturers, and models
- **Advanced Querying**: Filtering, sorting, pagination on all list endpoints
- **Relationship Management**: Favorite cars, owner restrictions

### tRPC Procedures
- **Type Safety**: Full compile-time type checking between client and server
- **Rate Limiting**: Different procedure types with appropriate rate limits
- **Authentication**: Seamless JWT integration
- **Error Handling**: Consistent error responses across all procedures

### Auto-Generated Documentation
- **Swagger UI**: Interactive API docs at `/docs` (development)
- **OpenAPI Spec**: YAML export for external tooling
- **Parameter Documentation**: Query and path parameters auto-documented
- **Response Schemas**: Consistent response format documentation

## Development Experience

### Schema-First Workflow
```typescript
// 1. Define Zod schema
export const createCarSchema = z.object({
  modelId: z.string().uuid(),
  color: z.string().min(1).max(50),
  year: z.number().int().gte(1900),
  price: z.number().min(0),
});

// 2. Generate DTO
export class CreateCarDto extends createZodDto(createCarSchema) {}

// 3. Use in controller with validation
@Post()
async create(@Body() dto: CreateCarDto) {
  // dto is automatically validated and typed
}
```

### Custom Validation Decorators
```typescript
@Get()
async findAll(
  @zQuery("color", z.string().optional()) color?: string,
  @zQuery("skip", z.number().int().gte(0).default(0)) skip = 0,
  @zQuery("limit", z.number().int().gte(1).lte(100).default(20)) limit = 20,
) {
  // All parameters validated automatically
  // Swagger docs generated automatically
}
```

### Type-Safe tRPC Client
```typescript
// Frontend automatically gets full type safety
const cars = await trpc.cars.findAll.query({
  color: "red",    // ✅ Typed
  skip: 0,         // ✅ Typed
  limit: 20        // ✅ Typed
});
// Response is fully typed automatically!
```

## Sample Data

The seed script creates comprehensive sample data:
- **2 Users**: Admin user (`admin`/`admin123`) and regular user (`jondoe`/`password123`)
- **10 Car Manufacturers**: Toyota, Honda, Ford, BMW, Mercedes-Benz, Audi, Volkswagen, Nissan, Hyundai, Tesla
- **50 Car Models**: 5 models per manufacturer with proper slugs
- **Relationships**: Proper foreign key relationships between all entities

## Environment Setup

### Database Configuration
Create `apps/api/.env.local`:
```env
NODE_ENV=development
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=demo_db
POSTGRES_USERNAME=admin
POSTGRES_PASSWORD=admin
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### First-Time Setup
```bash
# 1. Install dependencies
pnpm install

# 2. Setup database (PostgreSQL required)
# Create database 'demo_db' with user 'admin'

# 3. Run migrations
pnpm --filter api migrations:run

# 4. Seed database
pnpm --filter api seed

# 5. Start development
pnpm dev:api
```

## Communication Style

**IMPORTANT**: Keep responses concise. This is a demonstration project for inspiration.

## App-Specific Guidelines

For detailed development guidelines:
- **API Development**: `apps/api/CLAUDE.md` - Comprehensive NestJS patterns and architecture
- **Frontend Development**: `apps/web/CLAUDE.md` - Next.js patterns and tRPC integration *(in development)*

## Key Inspiration Points

This project demonstrates:
1. **Schema-First Development** - How Zod can be the single source of truth
2. **Dual API Strategy** - REST for external integration + tRPC for type safety
3. **Advanced Validation** - Custom decorators for parameter validation
4. **Auto-Documentation** - Swagger docs generated from schemas
5. **Production Patterns** - Error handling, rate limiting, authentication
6. **Type Safety** - End-to-end type inference from database to frontend
7. **Modern Stack** - Latest NestJS, tRPC, TypeORM, and Zod patterns

Use this project as inspiration for building modern, type-safe, well-documented APIs with excellent developer experience.