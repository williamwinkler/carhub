# API Development Guidelines

This file provides specific guidance for working with the NestJS API in this project.

## Architecture Overview

This API follows **Domain-Driven Design** principles with a **Schema-First** approach:
- **Schema-First Development**: Zod schemas are the single source of truth
- **Type Safety**: End-to-end type safety from database → service → controller → tRPC → frontend
- **Layered Architecture**: Entity → Service → Controller → tRPC with clear separation of concerns
- **Authorization**: Role-based access control with user-specific resource ownership
- **Rate Limiting**: Multi-tiered rate limiting for different operation types

## Testing Requirements

**CRITICAL**: When working on any code in this `/api` directory, Claude MUST:
1. Write or rewrite comprehensive tests for all changes made
2. Test BOTH success (sunshine) AND failure (error) scenarios extensively
3. Run `pnpm test:cov` to verify 90%+ coverage requirement
4. Run `pnpm test` to verify all tests pass
5. Ensure all tests pass before considering the task complete
6. Never skip testing - this is mandatory for all API modifications

## NestJS Patterns & Architecture

### Module Structure
- Follow NestJS module pattern: `module.ts`, `controller.ts`, `service.ts`
- DTOs in `dto/` folder using Zod schemas
- Entities in `entities/` folder using TypeORM decorators
- Tests in `*.spec.ts` files alongside source files

### TypeORM Database Integration
- **Database ORM**: Using TypeORM for database operations and entity management
- **Entities**: All database models extend `AbstractEntity` base class with UUID primary keys
- **Repository Pattern**: Inject repositories using `@InjectRepository(Entity)` decorator
- **Relationships**: Use TypeORM decorators (`@ManyToOne`, `@OneToMany`, etc.) for entity relationships
- **Entity Structure**:
  - All entities extend `AbstractEntity` (provides UUID primary key)
  - Use `@Entity()` decorator with table name specification
  - **IMPORTANT**: Add audit fields manually: `createdAt`, `updatedAt`, `deletedAt` for soft deletes
  - Use appropriate column types and constraints (`@Column`, `@CreateDateColumn`, `@UpdateDateColumn`, `@DeleteDateColumn`)
  - Define relationships with proper cascade and eager loading options
- **Service Integration**: Services should use injected repositories instead of in-memory storage
- **Query Building**: Use QueryBuilder for complex queries with joins, filtering, and pagination
- **Soft Deletes**: Implement soft deletes using `@DeleteDateColumn()` and `softDelete()` method

### Schema-First Development
- Define Zod schemas in `dto/` folder first
- Use `createZodDto(schema)` to generate NestJS DTOs
- Schemas drive both validation and Swagger documentation
- All responses use `wrapResponse()` utility for consistency

### Testing Standards
- **Unit Tests**: Test services and controllers in isolation using auto-mocking patterns
- **Integration Tests**: Test full request/response cycles
- **Coverage**: **MANDATORY 90%+ test coverage** on services, controllers, and business logic - run `pnpm test:cov` to verify
- **Error Testing**: **CRITICAL** - Test ALL error scenarios including:
  - UserNotFoundError, CarNotFoundError, UnauthorizedError
  - Validation failures (invalid inputs, missing fields)
  - Authorization failures (wrong roles, missing permissions)
  - Business logic errors (duplicate usernames, etc.)
  - Rate limiting exceeded scenarios
- **Test Data**: Use factories or fixtures for consistent test data
- **Mocking**: Mock external dependencies using ModuleMocker auto-mocking pattern
- **Non-Sunshine Paths**: Every method must test both success AND failure cases
- **Test Value**: **ALL TESTS MUST PROVIDE VALUE** - Remove tests that only test framework wiring or configuration without business logic
- **Focus**: Test business logic, not framework setup. tRPC routers are just wiring - test the underlying services instead

### Rate Limiting Implementation
- **REST API**: Protected by `CustomThrottlerGuard` with tiered limits (short/medium/long)
- **tRPC**: Use appropriate procedure types for different operation sensitivities:
  - `publicProcedure`: 1000 req/min (IP-based, for public endpoints)
  - `authProcedure`: 10 req/15min (auth operations like login/register)
  - `authenticatedRateLimitedProcedure`: 100 req/min (standard authenticated operations)
  - `authenticatedStrictProcedure`: 5 req/min (sensitive operations like deleting)
  - `burstProtectedProcedure`: 10 req/sec (high-frequency endpoints)
- **User Tracking**: Authenticated users tracked by `userId`, unauthenticated by IP address
- **Configuration**: Rate limits defined in `app.module.ts` ThrottlerModule configuration

### Error Handling
- **Domain Errors**: Use custom error classes in `common/errors/domain/` (CarNotFoundError, etc.)
- **HTTP Status Mapping**: Domain errors automatically map to appropriate HTTP status codes
- **Zod Validation**: Automatic validation error handling via `ZodValidationPipe`
- **Global Filter**: `HttpErrorFilter` catches and formats all exceptions consistently
- **Authorization Errors**: Use specific error classes like `UsersCanOnlyUpdateOwnCarsError`
- **Swagger Documentation**: Use `@NotFoundDecorator()` and similar for API documentation
- **Error Response Format**: All errors follow consistent response wrapper format

### Security Best Practices
- Never log or expose sensitive data
- Use role-based authorization with `@Roles()` decorator
- Validate all inputs with Zod schemas
- Apply rate limiting to all endpoints

### Swagger Documentation
- Use `@ApiResponseDto()` and `@ApiResponseListDto()` for consistent responses
- Document all endpoints with proper OpenAPI decorators
- Zod schemas automatically generate parameter documentation
- Available at `/docs` in development mode

## Development Workflow

### Adding New Endpoints
1. **Entity Creation**: Create TypeORM entities in `entities/` folder extending `AbstractEntity`
   - Add audit columns: `@CreateDateColumn()`, `@UpdateDateColumn()`, `@DeleteDateColumn()`
   - Define relationships with proper cascade options
   - Use appropriate column types and constraints
2. **Schema Definition**: Define Zod schemas in `dto/` folder for validation
   - Create separate schemas for create, update, and response DTOs
   - Export individual field schemas for reuse (e.g., `carIdSchema`)
3. **DTO Generation**: Create NestJS DTOs using `createZodDto(schema)`
4. **Service Implementation**: Implement service methods with TypeORM repository operations
   - Use QueryBuilder for complex queries with joins
   - Implement proper error handling with domain-specific errors
   - Add authorization checks using `Ctx.principalRequired()`
5. **Controller Creation**: Create controller endpoints with proper decorators
   - Use `@ApiEndpoint()` for consistent Swagger documentation
   - Apply `@Roles()` and `@Public()` decorators appropriately
   - Use `@zQuery()` and `@zParam()` for validated parameters
6. **Adapter Pattern**: Create adapters to convert entities to DTOs cleanly
7. **tRPC Integration**: Add tRPC procedures if needed for frontend consumption
8. **Testing**: Write comprehensive tests for all functionality (both success and error cases)
9. **Coverage Verification**: Run `pnpm test:cov` to verify 90%+ coverage
10. **Final Validation**: Run `pnpm test` and `pnpm lint` to verify implementation

### Code Quality Checks
- Run `pnpm test:cov` to verify 90%+ test coverage
- Run `pnpm lint` before committing
- Ensure all tests pass with `pnpm test`
- Check type safety with TypeScript compiler
- Verify Swagger docs are generated correctly

## Common Utilities

### Response Wrapping
```typescript
return wrapResponse(data, 'Success message');
```

### Validation Decorators
```typescript
@zQuery(QuerySchema)
@zParam(ParamSchema)
```

### Authentication Guards
```typescript
@UseGuards(AuthGuard)
@Roles(UserRole.ADMIN)
```

## File Organization
```
src/
├── common/          # Shared utilities, guards, interceptors
│   ├── decorators/  # Custom decorators (@zQuery, @ApiEndpoint, @Roles)
│   ├── errors/      # Domain error classes
│   ├── filters/     # Global exception filters
│   ├── guards/      # Authentication, authorization, throttling guards
│   ├── interceptors/ # Response validation, traffic logging
│   ├── middlewares/ # Context middleware for CLS
│   ├── schemas/     # Shared Zod schemas (pagination, sorting)
│   └── utils/       # Utility functions (swagger, response wrapping)
├── modules/         # Feature modules
│   ├── database/    # TypeORM configuration and base entities
│   │   ├── abstract.entity.ts
│   │   └── database.module.ts
│   ├── cars/        # Example feature module
│   │   ├── dto/     # Zod schemas and DTOs
│   │   ├── entities/ # TypeORM entities
│   │   ├── cars.adapter.ts   # Entity-to-DTO conversion
│   │   ├── cars.controller.ts # REST endpoints
│   │   ├── cars.service.ts    # Business logic
│   │   ├── cars.trpc.ts       # tRPC procedures
│   │   ├── cars.module.ts     # Module definition
│   │   ├── cars.types.ts      # Type definitions
│   │   └── cars.*.spec.ts     # Tests
│   ├── trpc/        # tRPC router and middleware
│   └── auth/        # Authentication module
├── app.module.ts    # Root module with global providers
├── main.ts          # Application bootstrap
└── setup-swagger.ts # Swagger configuration
```

## Naming Conventions
- **Modules**: Use kebab-case for module directories (`car-manufacturers`, not `manufacturers`)
- **Files**: Use kebab-case with descriptive suffixes (`.service.ts`, `.controller.ts`, `.trpc.ts`)
- **Classes**: Use PascalCase with descriptive suffixes (`CarsService`, `CarNotFoundError`)
- **DTOs**: Always end with `Dto` suffix (`CreateCarDto`, `CarDto`)
- **Entities**: Use singular nouns (`Car`, `User`, not `Cars`, `Users`)
- **Endpoints**: Use RESTful conventions (`GET /cars`, `POST /cars`, `GET /cars/:id`)