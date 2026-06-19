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

Do not generate or add a TypeScript Swagger client for the web app by default.
If a reusable runtime tRPC client package is needed later, keep it separate from
`@repo/api-contract`. If a REST/OpenAPI client is needed later, create a
separate runtime package for that REST surface.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🏗️ Architecture Overview

![test](/docs/architecture.png)

## 🧑‍💻 Improved DX

### Improved Nestjs Swagger Documentation

- Auto-generated DTOs from Zod schemas
- Compile time error if the Swagger specified DTO and actual DTO are different!
- Query and path parameter DTOs from `createZodDto` are validated by
  `ZodValidationPipe` and show up in Swagger/OpenAPI.
- Specified errors your app can throw and each will show up in the
  documentation.
- Common errors are automatically derived in the swagger docs:
  - Each endpoint automatically gets `429` and `500` error examples added.
  - If the endpoint performs any validation, `400 Valiation Error` is added.
  - Protected endpoints get the `401 Unauthorized` and `403 Forbidden`
    examples automatically.
- [See code examples below!](#-code-examples)

### Better feature development loop

- It's faster and more reliable with tRPC.
  - Procedure types are immediately updated in the frontend - no codegen needed.
  - Jump between frontend and backend code easily.
  - See directly where each tRPC procedure is used in the frontend.
  - Backend errors are automatically converted to tRPC errors in middleware.
- A postgres DB and pgadmin are automatically started when running
  `pnpm dev`.

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

# 5. Start the development database
docker compose up -d

# 6. Run database migrations
pnpm --filter api migrations:run

# (optional) Seed with sample data
pnpm --filter api seed

# Start both the frontend and backend
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

## 🎯 Code Examples

### Schema-First Development

```typescript
// 1. Define Zod schema (single source of truth)
export const createCarSchema = z.object({
  modelId: z.string().uuid(),
  color: z.string().min(1).max(50),
  year: z.number().int().gte(1900),
  price: z.number().min(0),
});

// 2. Auto-generate DTO for Swagger
export class CreateCarDto extends createZodDto(createCarSchema) {}

// 3. Use in controller with automatic validation
@Post()
@SwaggerInfo({
  status: 201,
  summary: "Create a car",
  successText: "Car was succesfully created",
  type: CarDto, // <- Won't compile if a CarDto is not returned!
  errors: [Errors.SOME_ERROR]
})
async create(@Body() dto: CreateCarDto) {
  // dto is validated and typed automatically!
}
```

### Query and Path Parameter DTOs

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

### tRPC Type Safety

```typescript
// Frontend/runtime client setup uses the stable type-only contract package.
import type { AppRouter } from "@repo/api-contract";

const car = await trpc.cars.getById.query({
  id: "<UUID>", // ✅ typed input
});
// Response is automatically typed as well.
```

On the API side, tRPC procedures live in `apps/api/src/modules/**/*.trpc.ts`,
use Zod input/output schemas, apply shared tRPC auth/context/error/rate-limit
middlewares, and delegate business logic to Nest services.

## 📄 License

MIT - Feel free to use this as inspiration for your own projects!
