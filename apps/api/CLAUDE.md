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
- Tests in `*.spec.ts` files alongside source files

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
1. Define Zod schemas in `dto/` folder
2. Create NestJS DTOs using `createZodDto()`
3. Implement service methods with business logic
4. Create controller endpoints with proper decorators
5. Add tRPC procedures if needed for frontend consumption
6. Write comprehensive tests for all functionality (both success and error cases)
7. Run `pnpm test:cov` to verify 90%+ coverage
8. Run `pnpm test` to verify implementation
9. Update Swagger documentation if needed

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
│   ├── cars/        # Example feature module
│   │   ├── dto/     # Zod schemas and DTOs
│   │   ├── cars.controller.ts
│   │   ├── cars.service.ts
│   │   ├── cars.module.ts
│   │   └── cars.*.spec.ts
│   └── ...
└── main.ts         # Application bootstrap
```