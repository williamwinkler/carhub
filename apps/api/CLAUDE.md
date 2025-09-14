# API Development Guidelines

This file provides specific guidance for working with the NestJS API in this project.

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
  - Include audit fields: `createdAt`, `updatedAt`, `deletedAt` (for soft deletes)
  - Use appropriate column types and constraints
- **Service Integration**: Services should use injected repositories instead of in-memory storage

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
- Use appropriate procedure types for tRPC endpoints:
  - `publicProcedure`: 1000 req/min (IP-based)
  - `authProcedure`: 10 req/15min (auth operations)
  - `authenticatedRateLimitedProcedure`: 100 req/min (standard)
  - `authenticatedStrictProcedure`: 5 req/min (sensitive)
  - `burstProtectedProcedure`: 10 req/sec (high-frequency)

### Error Handling
- Use appropriate HTTP status codes
- Leverage Zod validation errors (handled automatically)
- Custom error decorators: `@BadRequest()`, `@NotFound()`, etc.
- Global `HttpErrorFilter` handles uncaught exceptions

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
1. Create TypeORM entities in `entities/` folder extending `AbstractEntity`
2. Define Zod schemas in `dto/` folder for validation
3. Create NestJS DTOs using `createZodDto()`
4. Implement service methods with TypeORM repository operations
5. Create controller endpoints with proper decorators
6. Add tRPC procedures if needed for frontend consumption
7. Write comprehensive tests for all functionality (both success and error cases)
8. Run `pnpm test:cov` to verify 90%+ coverage
9. Run `pnpm test` to verify implementation
10. Update Swagger documentation if needed

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
├── modules/         # Feature modules
│   ├── database/    # TypeORM configuration and base entities
│   │   ├── abstract.entity.ts
│   │   └── database.module.ts
│   ├── cars/        # Example feature module
│   │   ├── dto/     # Zod schemas and DTOs
│   │   ├── entities/ # TypeORM entities
│   │   ├── cars.controller.ts
│   │   ├── cars.service.ts
│   │   ├── cars.module.ts
│   │   └── cars.*.spec.ts
│   └── ...
└── main.ts         # Application bootstrap
```