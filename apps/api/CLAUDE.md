# API Development Guidelines

This file provides specific guidance for working with the NestJS API in this project.

## Architecture Overview

This API demonstrates **modern NestJS patterns** with a **Schema-First** approach using Zod:
- **Schema-First Development**: Zod schemas are the single source of truth for validation and types
- **Type Safety**: End-to-end type safety from database → service → controller → tRPC → frontend
- **Dual API Architecture**: REST endpoints for external integrations + tRPC for type-safe frontend communication
- **Advanced Validation**: Custom decorators for query/path parameters with automatic Swagger documentation
- **Tiered Rate Limiting**: Multi-tiered rate limiting for different operation sensitivities
- **Role-Based Access Control**: JWT authentication with role-based authorization

## Key Technologies

### Database & ORM
- **TypeORM**: Database integration with PostgreSQL
- **Entity Management**: AbstractEntity base class with UUID primary keys
- **Relationships**: Proper entity relationships with cascade options
- **Migrations**: TypeORM migration system for schema management
- **Seeding**: Comprehensive seed script with sample data

### Validation & Documentation
- **Zod Schemas**: Single source of truth for validation and types
- **nestjs-zod**: Auto-generation of NestJS DTOs from Zod schemas
- **Custom Decorators**: `@zQuery()` and `@zParam()` for validated parameters
- **Swagger Integration**: Auto-generated OpenAPI documentation
- **Error Handling**: Comprehensive error system with proper HTTP status codes

### Security & Performance
- **JWT Authentication**: Access and refresh token system
- **Rate Limiting**: Tiered rate limiting with different levels (public, auth, strict)
- **CORS Configuration**: Proper CORS setup for frontend integration
- **Input Validation**: All inputs validated through Zod schemas

## API Features Demonstrated

### REST Endpoints (OpenAPI/Swagger)

#### Authentication (`/api/v1/auth`)
- `POST /login` - User authentication with JWT tokens
- `POST /refresh` - Refresh access tokens
- `POST /logout` - Logout and token invalidation

#### Users (`/api/v1/users`)
- `GET /users` - List users with pagination (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user (admin only)

#### Car Manufacturers (`/api/v1/car-manufacturers`)
- `GET /car-manufacturers` - List all manufacturers with pagination
- `POST /car-manufacturers` - Create new manufacturer (admin)
- `GET /car-manufacturers/:id` - Get manufacturer details
- `PUT /car-manufacturers/:id` - Update manufacturer (admin)
- `DELETE /car-manufacturers/:id` - Delete manufacturer (admin)

#### Car Models (`/api/v1/car-models`)
- `GET /car-models` - List models with manufacturer filtering
- `POST /car-models` - Create new car model (admin)
- `GET /car-models/:id` - Get model details
- `PUT /car-models/:id` - Update car model (admin)
- `DELETE /car-models/:id` - Delete car model (admin)

#### Cars (`/api/v1/cars`)
- `GET /cars` - List cars with filtering, sorting, and pagination
- `POST /cars` - Create new car listing (user)
- `GET /cars/:id` - Get car details
- `PUT /cars/:id` - Update car (owner/admin)
- `DELETE /cars/:id` - Delete car (owner/admin)
- `PATCH /cars/:id/favorite` - Toggle favorite status (user)
- `GET /cars/favorites` - Get user's favorite cars

### tRPC Endpoints (`/trpc`)

All REST functionality is also available through type-safe tRPC procedures:

```typescript
// Frontend usage example
const cars = await trpc.cars.findAll.query({
  modelId: "uuid",
  color: "red",
  skip: 0,
  limit: 20
});
// Types are automatically inferred!
```

#### Procedure Types by Rate Limiting
- **publicProcedure**: 1000 req/min (IP-based, for public endpoints)
- **authProcedure**: 10 req/15min (auth operations like login/register)
- **authenticatedRateLimitedProcedure**: 100 req/min (standard authenticated operations)
- **authenticatedStrictProcedure**: 5 req/min (sensitive operations like deleting)
- **burstProtectedProcedure**: 10 req/sec (high-frequency endpoints)

## Schema-First Development Patterns

### 1. Define Zod Schemas

```typescript
export const createCarSchema = z.object({
  modelId: z.string().uuid(),
  color: z.string().min(1).max(50),
  year: z.number().int().gte(1900).lte(new Date().getFullYear() + 1),
  mileage: z.number().int().gte(0),
  price: z.number().min(0),
});

export const carQuerySchema = z.object({
  modelId: z.string().uuid().optional(),
  color: z.string().optional(),
  skip: z.number().int().gte(0).default(0),
  limit: z.number().int().gte(1).lte(100).default(20),
});
```

### 2. Generate DTOs

```typescript
export class CreateCarDto extends createZodDto(createCarSchema) {}
export class CarQueryDto extends createZodDto(carQuerySchema) {}
```

### 3. Use in Controllers with Custom Decorators

```typescript
@Post()
@Roles("user")
@ApiEndpoint({
  status: HttpStatus.CREATED,
  summary: "Create a car",
  successText: "Car created successfully",
  type: CarDto,
})
async create(@Body() dto: CreateCarDto) {
  // Implementation
}

@Get()
@Public()
@ApiEndpoint({
  status: HttpStatus.OK,
  successText: "List of cars",
  type: [CarDto],
})
async findAll(
  @zQuery("modelId", carFields.id.optional()) modelId?: UUID,
  @zQuery("color", carFields.color.optional()) color?: string,
  @zQuery("skip", skipSchema.optional()) skip = 0,
  @zQuery("limit", limitSchema.optional()) limit = 20,
) {
  // Implementation - all parameters are validated automatically
}
```

## Advanced Features

### Custom Zod Decorators
- `@zQuery(name, schema)` - Validates query parameters with Zod
- `@zParam(name, schema)` - Validates path parameters with Zod
- Automatic Swagger documentation generation
- Type-safe parameter extraction

### Error Handling System
```typescript
// Centralized error definitions
export const Errors = {
  CAR_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: "Car not found",
  },
  CAR_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: "Car already exists",
  }
};

// Usage in services
throw new AppError(Errors.CAR_NOT_FOUND);
```

### Rate Limiting Architecture
- **REST API**: Global `CustomThrottlerGuard` with configurable limits
- **tRPC**: Middleware-based rate limiting per procedure type
- **User Tracking**: Authenticated users by `userId`, unauthenticated by IP
- **Tiered Limits**: Different limits for different operation sensitivities

### Role-Based Authorization
```typescript
@Roles("admin", "user") // Multiple roles
@Roles("admin")         // Single role
@Public()              // Skip authentication
```

## Development Setup

### Database Setup
```bash
# Run migrations
pnpm migrations:run

# Seed database with sample data
pnpm seed

# Reset database (drops all data)
pnpm schema:drop && pnpm migrations:run && pnpm seed
```

### Environment Configuration
- **Development**: Uses `.env.local` file
- **Test**: Uses `.env.test` file
- **Production**: Uses environment variables

### Testing
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

## File Organization

```
src/
├── common/              # Shared utilities and infrastructure
│   ├── decorators/      # Custom decorators (@zQuery, @ApiEndpoint, @Roles)
│   ├── errors/          # Error handling system
│   ├── filters/         # Global exception filters
│   ├── guards/          # Authentication and authorization guards
│   ├── interceptors/    # Response formatting and logging
│   ├── middlewares/     # Context and rate limiting middleware
│   ├── schemas/         # Shared Zod schemas
│   └── utils/           # Utility functions
├── modules/             # Feature modules
│   ├── database/        # TypeORM configuration
│   ├── auth/           # Authentication system
│   ├── users/          # User management
│   ├── car-manufacturers/ # Car manufacturer management
│   ├── car-models/     # Car model management
│   ├── cars/           # Car listing management
│   └── trpc/           # tRPC router and procedures
├── app.module.ts       # Root module
├── main.ts             # Application bootstrap
└── setup-swagger.ts    # Swagger configuration
```

## Data Model

### Entities
- **User**: Authentication and profile management
- **CarManufacturer**: Car brands (Toyota, BMW, etc.)
- **CarModel**: Specific models (Camry, X5, etc.)
- **Car**: Individual car listings with owner relationships

### Relationships
```
User 1:N Car (owner relationship)
CarManufacturer 1:N CarModel
CarModel 1:N Car
User M:N Car (favorites through join table)
```

## API Documentation

### Swagger/OpenAPI
- **Development**: Interactive docs at `/docs`
- **Production**: YAML spec exported to `swagger.yml`
- **Auto-generated**: From Zod schemas and decorators
- **Consistent responses**: All endpoints follow standard response format

### Response Format
```json
{
  "apiVersion": "string",
  "data": {
    // Single item or paginated list with meta
  }
}
```

This API demonstrates production-ready patterns for building scalable, type-safe REST APIs with comprehensive documentation, security, and performance optimizations.