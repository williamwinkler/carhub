# Carhub

Carhub is a simple demo project allowing users to create and view cars, but the
interesting part is the tech stack used.

The project demonstrates **end-to-end type safety** and **auto-generated
documentation** using NestJS, tRPC, Swagger and Zod. The project's goal is to
have top tier DX when working with APIs - both in the front and backend.

## API Consumer Strategy

Carhub exposes two intentional API surfaces:

- **TypeScript + user/session flow:** use tRPC with JWT bearer auth.
  TypeScript consumers import router types from the type-only
  `@repo/api-contract` package.
- **Non-TypeScript or external programmatic integration:** use REST/OpenAPI with
  `x-api-key` auth and generate clients from the Swagger/OpenAPI document when
  needed.

## 🏗️ Architecture Overview

![test](/docs/architecture.png)

## 🧑‍💻 Improved DX

Carhub improves several parts of the development loop. They solve different
problems:

| Workflow                                 | Best surface                     | Why it is better                                                                                                                          |
| ---------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| First-party TypeScript app development   | tRPC                             | Fast TS-to-TS feedback: inferred inputs/outputs, no client codegen, and editor navigation from frontend calls to backend procedures.      |
| REST documentation and generated clients | Swagger/OpenAPI                  | Better language-neutral contract: generated docs, generated SDKs, explicit HTTP status/error examples, and API-key based external access. |
| Configuration safety                     | Zod-validated environment config | API and web config are validated at startup/build time, so broken env values fail fast instead of failing during a request.              |
| Repository workflow                      | pnpm workspaces                  | One install, one lockfile, local package linking, and filtered commands for running only the app or package you are working on.           |

### REST/OpenAPI DX: better Swagger documentation

Use REST/OpenAPI when the API needs public HTTP docs, generated SDKs, or
non-TypeScript/external consumers.

- Auto-generated DTOs from Zod schemas via `createZodDto`.
- Compile-time error if the Swagger-declared DTO and actual returned DTO do not
  match.
- Query and path parameter DTOs from `createZodDto` are validated by
  `ZodValidationPipe` and show up in Swagger/OpenAPI.
- Specified application errors show up in the generated documentation.
- Common errors are automatically derived in the Swagger docs:
  - Each endpoint automatically gets `429` and `500` error examples.
  - Endpoints with validation get a `400 Validation Error` example.
  - Protected endpoints get `401 Unauthorized` and `403 Forbidden` examples.
- [See REST/OpenAPI code examples below.](#restopenapi-best-for-swagger-generation)

### tRPC DX: better first-party TypeScript feature development

Use tRPC for workspace TypeScript clients like `apps/web`, where the frontend
and backend can share the live `AppRouter` type through `@repo/api-contract`.

- Procedure types are immediately available in the frontend — no Swagger client
  generation step.
- Inputs and outputs are inferred from backend Zod `.input(...)` and
  `.output(...)` schemas.
- Cmd/Ctrl-click can jump from `trpc.cars.create` in the frontend to the actual
  backend procedure implementation.
- It is easy to find where each tRPC procedure is used in the frontend.
- Backend errors are converted to tRPC errors in shared middleware.
- [See tRPC code examples below.](#trpc-best-for-first-party-typescript-to-typescript-dx)

### Configuration DX: fail-fast environment validation

Use Zod for environment configuration so broken local, test, or production
environments fail at startup/build time instead of failing later during a
request.

- API environment variables are declared in
  `apps/api/src/modules/config/config.schema.ts`.
- Nest `ConfigModule` runs `validateEnv(...)` during API startup.
- Web environment variables are declared in `apps/web/env.ts`.
- `apps/web/next.config.ts` validates web env during `next dev` and
  `next build`, then injects the validated `NEXT_PUBLIC_API_URL` value.
- Missing or invalid variables produce a structured Zod error immediately.
- Coerced API values such as `PORT` and `POSTGRES_PORT` become numbers before
  app code reads them.
- API `ConfigService.get(...)` is typed from the inferred config schema, so
  callers get typed config values instead of arbitrary strings.
- Web `NEXT_PUBLIC_API_URL` defaults to `http://localhost:3001` for local
  development, but fails fast if a provided value is not a valid URL.

### Monorepo DX: pnpm workspaces

The repo is organized as a pnpm workspace with `apps/*` and `packages/*` from
`pnpm-workspace.yaml`. That keeps the frontend, backend, and shared packages in
one TypeScript workspace without publishing internal packages during local
iteration.

- One `pnpm install` installs the whole repo from a single lockfile.
- Workspace packages such as `@repo/api-contract` are linked locally with
  `workspace:*`, so frontend type changes track backend contract changes during
  development.
- Filtered commands keep feedback loops focused:
  - `pnpm --filter api dev`
  - `pnpm --filter web dev`
  - `pnpm --filter @repo/api-contract build`
- Root scripts compose common workflows, for example `pnpm build` builds
  packages before apps, `pnpm dev:db` starts local Docker services, and
  `pnpm dev` starts only the API and web dev servers.
- Shared TypeScript tooling and package boundaries make it easier to keep API,
  web, and contract code consistent.

### Local development DX

- `pnpm dev:db` starts the local Postgres DB and pgAdmin through Docker Compose.
- Docker must be installed and running before using `pnpm dev:db`.
- The local Docker defaults are intentionally simple:
  - Postgres: `postgres` / `postgres`, database `carhub`, port `5432`.
  - pgAdmin: `admin@admin.com` / `admin`, available at
    <http://localhost:5050>.
- `pnpm dev` starts only the API and web dev servers. It does not start
  containers; run `pnpm dev:db` separately first when using the local Docker DB.

## 🎯 Code Examples

### Schema-First Development

Zod schemas are the source of truth. The API has two adapters over those
schemas, each optimized for a different DX:

- **REST/OpenAPI:** wrap Zod schemas with `createZodDto(...)` so Nest can
  validate requests and Swagger can generate language-neutral documentation.
- **tRPC:** pass Zod schemas directly to `.input(...)` and `.output(...)` so
  first-party TypeScript clients infer inputs/outputs from the real router.

#### REST/OpenAPI: best for Swagger generation

```typescript
// 1. Define Zod schema (single source of truth)
export const createCarSchema = z.object({
  modelId: z.string().uuid(),
  color: z.string().min(1).max(50),
  year: z.number().int().gte(1900),
  price: z.number().min(0),
});

// 2. Auto-generate DTO metadata for Nest validation and Swagger/OpenAPI
export class CreateCarDto extends createZodDto(createCarSchema) {}

// 3. Use the DTO in REST controllers
@Post()
async create(@Body() dto: CreateCarDto) {
  // dto is validated by ZodValidationPipe.
  // createZodDto exposes the schema metadata used by Swagger/OpenAPI.
  return this.carsService.create(dto);
}
```

#### Query and Path Parameter DTOs

```typescript
const findCarsQuerySchema = z.object({
  color: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  skip: z.coerce.number().int().min(0).default(0),
});

const carIdParamSchema = z.object({
  carId: z.uuid(),
});

class FindCarsQueryDto extends createZodDto(findCarsQuerySchema) {}
class CarIdParamDto extends createZodDto(carIdParamSchema) {}

@Get(":carId")
async findCars(
  @Param() params: CarIdParamDto,
  @Query() query: FindCarsQueryDto,
) {
  // params and query are validated by ZodValidationPipe.
  // nestjs-zod exposes the DTO schemas to Swagger/OpenAPI.
}
```

#### tRPC: best for first-party TypeScript-to-TypeScript DX

```typescript
// API side: procedures use Zod directly. No DTO or Swagger client is needed.
export const createCarsRouter = ({ trpc, carsService }: CarsRouterDeps) =>
  trpc.router({
    create: trpc.protectedProcedure
      .input(createCarSchema)
      .output(carSchema)
      .mutation(({ input, ctx }) => {
        return carsService.create(input, ctx.principal.userId);
      }),
  });
```

```typescript
// Frontend side: runtime client setup uses the stable type-only contract package.
import type { AppRouter } from "@repo/api-contract";

const car = await trpc.cars.getById.query({
  id: "<UUID>", // ✅ typed input
});
// Response is automatically typed as well.
```

On the API side, tRPC procedures live in `apps/api/src/modules/**/*.trpc.ts`,
apply shared tRPC auth/context/error/rate-limit middlewares, and delegate
business logic to Nest services. Use tRPC for first-party TS-to-TS product code;
use Swagger/OpenAPI when the goal is generated clients, public HTTP docs, or
non-TypeScript integration.

## ⚡ Quick Start

### Prerequisites

- Node.js 24+
- Docker installed and running
- pnpm (`npm install -g pnpm`)

### Installation (Development)

```bash
# 1. Clone the repository
git clone https://github.com/williamwinkler/carhub.git
cd carhub

# 2. Install dependencies
pnpm install

# 3. Setup environment files
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local

# 4. Configure your environment files (recommended)
pnpm build:packages

# 5. Start the development database and pgAdmin
pnpm dev:db

# 6. Run database migrations
pnpm --filter api migrations:run

# (optional) Seed with sample data
pnpm --filter api seed

# Start the frontend and backend
# This does not start containers; run pnpm dev:db first for the local DB.
pnpm dev
```

### Sample Data Created

- **2 Users**: `admin`/`admin` and `jondoe`/`jondoe`
- **10 Manufacturers**: Toyota, Honda, Ford, BMW, Mercedes-Benz, etc.
- **50 Car Models**: 5 models per manufacturer with slugs
- **Full Relationships**: Proper foreign keys and cascading

## 📖 API Swagger Documentation

Once running, visit:

- **Swagger UI**: <http://localhost:3001/docs>
- **OpenAPI Spec**: <http://localhost:3001/swagger.yml>

## 📄 License

MIT - Feel free to use this as inspiration for your own projects!
