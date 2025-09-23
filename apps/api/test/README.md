# Testing Strategy Documentation

This document describes the comprehensive testing strategy implemented for this NestJS API following best practices for optimal developer experience and test reliability.

## Test Architecture Overview

The testing structure follows a three-tier approach optimized for speed, isolation, and reliability:

```
test/
├── unit/           # Fast, isolated unit tests (pure business logic)
├── integration/    # Module-level tests with real database
├── e2e/           # Full HTTP API tests (critical paths only)
├── helpers/       # Shared test utilities and database setup
└── factories/     # Test data factories for consistent fixtures
```

## Test Types and Their Purpose

### 1. Unit Tests (`test/unit/`)
- **Scope**: Pure business logic, services, guards, pipes, utilities
- **Speed**: Sub-second execution (< 100ms per test)
- **Database**: None - all dependencies mocked
- **Isolation**: Complete - no external dependencies
- **Coverage**: Business rules, edge cases, error handling

**When to use**:
- Testing service methods with mocked repositories
- Guard logic and authorization rules
- Utility functions and pure transformations
- Error handling and validation logic

**Example**:
```typescript
// test/unit/cars/cars.service.spec.ts
describe('CarsService (Unit)', () => {
  // Mock all dependencies, test business logic only
});
```

### 2. Integration Tests (`test/integration/`)
- **Scope**: Module-level functionality with real database
- **Speed**: Moderate (1-5 seconds per test)
- **Database**: Real PostgreSQL with transactions
- **Isolation**: Database transactions (rollback after each test)
- **Coverage**: Database operations, repository queries, business logic with persistence

**When to use**:
- Testing service methods that interact with TypeORM repositories
- Complex database queries and relationships
- Repository custom methods and query builders
- Business rules that depend on database state

**Example**:
```typescript
// test/integration/cars/cars.service.integration.spec.ts
describe('CarsService (Integration)', () => {
  // Real database, test persistence and queries
});
```

### 3. E2E Tests (`test/e2e/`)
- **Scope**: Full HTTP API with complete application bootstrap
- **Speed**: Slow (5-30 seconds per test)
- **Database**: Real PostgreSQL with full cleanup
- **Isolation**: Complete app instances
- **Coverage**: Critical user journeys, authentication, API contracts

**When to use**:
- Authentication flows (login, register, refresh)
- Critical CRUD operations for main resources
- Error handling at HTTP level
- Rate limiting and security features
- API contract validation

**Example**:
```typescript
// test/e2e/auth.e2e-spec.ts
describe('Auth (E2E)', () => {
  // Full app bootstrap, HTTP requests, complete flows
});
```

## Database Strategy

### Per-Worker Isolation
- Each Jest worker gets a unique database: `demo_test_db_w{WORKER_ID}_{TIMESTAMP}`
- Databases are created before tests and cleaned up after
- Prevents worker interference and allows parallel execution

### Transaction Wrapping
- Integration and E2E tests wrap each test in a database transaction
- Automatic rollback after each test ensures clean state
- Faster than truncating tables between tests

### Setup Flow
```typescript
beforeAll(() => {
  // Create unique database per worker
  // Run migrations
  // Setup data source
});

beforeEach(() => {
  // Begin transaction
  // Create test fixtures
});

afterEach(() => {
  // Rollback transaction
});

afterAll(() => {
  // Drop test database
  // Close connections
});
```

## Running Tests

### Development Workflow
```bash
# Fast feedback loop - unit tests only
pnpm test:unit
pnpm test:unit --watch

# Module testing with database
pnpm test:integration

# Critical path validation
pnpm test:e2e

# Complete test suite
pnpm test:all

# Coverage reports
pnpm test:cov          # Unit + Integration
pnpm test:cov:unit     # Unit tests only
```

### CI/CD Pipeline
```bash
# Parallel execution for speed
pnpm test              # Unit + Integration (fast)
pnpm test:e2e          # E2E (slower, run separately)
```

## Test Factories

Consistent test data generation using factory pattern:

```typescript
// test/factories/user.factory.ts
export const createUserFactory = (options = {}) => ({
  id: randomUUID(),
  username: `user_${id.slice(0, 8)}`,
  role: 'user',
  ...options,
});

// Usage in tests
const testUser = createUserFactory({ role: 'admin' });
```

## Best Practices

### Unit Tests
- Mock all external dependencies
- Test both success and failure scenarios
- Use descriptive test names that explain business rules
- Keep tests focused on single concerns
- Achieve > 90% coverage on business logic

### Integration Tests
- Use real database with transaction rollback
- Test complex queries and relationships
- Verify database constraints and triggers
- Test repository methods with real data

### E2E Tests
- Keep scenarios high-value and representative
- Test complete user journeys, not individual endpoints
- Include authentication in test flows
- Verify error responses and edge cases
- Test rate limiting and security features

### Common Patterns

#### Mocking with Auto-Mocker
```typescript
const module = await Test.createTestingModule({
  providers: [ServiceUnderTest],
})
.useMocker((token) => {
  if (typeof token === 'function') {
    const metadata = moduleMocker.getMetadata(token);
    const Mock = moduleMocker.generateFromMetadata(metadata);
    return new Mock();
  }
})
.compile();
```

#### Database Test Setup
```typescript
beforeEach(async () => {
  await beginTransaction();
  // Create test data within transaction
});

afterEach(async () => {
  await rollbackTransaction();
});
```

#### E2E Authentication
```typescript
const loginResponse = await request(app.getHttpServer())
  .post('/auth/login')
  .send({ username, password });

const token = loginResponse.body.data.accessToken;

// Use in subsequent requests
await request(app.getHttpServer())
  .get('/protected-endpoint')
  .set('Authorization', `Bearer ${token}`);
```

## Performance Optimization

### Parallel Execution
- Unit tests: Maximum parallelization (`maxWorkers: '100%'`)
- Integration tests: Sequential (`maxWorkers: 1`) to avoid database conflicts
- E2E tests: Sequential (`maxWorkers: 1`) for stability

### Test Isolation
- No shared state between tests
- Fresh mocks for each test
- Database transactions for data isolation
- Unique databases per worker

### Speed Optimization
- Unit tests should complete in < 100ms each
- Integration tests should complete in < 5s each
- E2E tests should complete in < 30s each
- Use `--bail` flag in CI to fail fast

## Debugging Tests

### Common Issues
1. **Slow tests**: Check for missing mocks or database cleanup
2. **Flaky tests**: Look for shared state or timing issues
3. **Memory leaks**: Ensure proper cleanup in `afterAll` hooks
4. **Database conflicts**: Verify unique database names per worker

### Debugging Commands
```bash
# Debug single test file
pnpm test:debug test/unit/cars/cars.service.spec.ts

# Verbose output
pnpm test:unit --verbose

# Watch mode for development
pnpm test:watch
```

This testing strategy provides fast feedback during development while ensuring comprehensive coverage of critical application paths.