# About

This demo project showcases:

- **Full type safety** between the backend and frontend using [tRPC](https://trpc.io/).
- **Improved NestJS Swagger documentation** generation using [Zod](https://zod.dev/) & [nestjs-zod](https://www.npmjs.com/package/nestjs-zod)
- **Monorepo architecture** for sharing types, schemas, and utilities between backend and frontend.

---

## Scenario

The demo addresses the following use case:

> You need an API that serves a frontend application **and** integrates with third-party systems over HTTP.

The architecture looks like this:

![Architecture Diagram](https://github.com/user-attachments/assets/caaa894c-16c9-4b08-ad97-4be3863be15a)

---

## Tech Stack

- **Backend:** [NestJS](https://nestjs.com/) with tRPC and Swagger
- **Frontend:** [Next.js](https://nextjs.org/) (App Router) with tRPC client
- **Type Sharing:** Shared TypeScript types & Zod schemas in a monorepo
- **Package Manager:** [pnpm](https://pnpm.io/)

---

## Features

- **End-to-end type safety** — no manual API client code, types are inferred from the backend.
- **Swagger API docs** — automatically generated for third-party integrations.
- **Shared validation** — Zod schemas are reused on both backend and frontend.
- **Pagination & CRUD demo** — example car listing with create, update, delete, and pagination.
- **Dark mode UI** — styled with TailwindCSS.

---
## Improved Swagger Documentation

This project uses **Zod** as the single source of truth for all DTOs and validation rules.  
With [`nestjs-zod`](https://github.com/colinhacks/zod) and some custom decorators, we can:

- Define DTOs **once** in Zod
- Automatically generate **NestJS DTO classes** for Swagger
- Validate **query parameters** and **path parameters**
- Keep Swagger docs **in sync** with runtime validation

---

### 1. Defining DTOs with Zod

We define our schemas in Zod, including descriptions for Swagger:

```ts
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { CarBrand } from "../entities/car.entity";

export const carBrandSchema = z
  .nativeEnum(CarBrand)
  .describe("The brand of the car.");

export const carModelSchema = z
  .string()
  .min(1, "Model name is required")
  .max(100, "Model name must be at most 255 characters long")
  .describe("The model of the car.");

export const createCarSchema = z.object({
  brand: carBrandSchema,
  model: carModelSchema,
  year: z.number().int().gte(1886),
  color: z.string(),
  kmDriven: z.number().int().gte(0),
  price: z.number().min(0),
});

export class CreateCarDto extends createZodDto(createCarSchema) {}
```

This gives us:
- **Runtime validation** via Zod
- **TypeScript types** inferred automatically
- **Swagger docs** generated from the DTO

---

### 2. Using DTOs in Controllers

```ts
@Post()
@ApiOperation({ summary: "Create a car" })
@ApiCreatedResponse({
  type: createResponseDto(CarDto),
  description: "Car created successfully",
})
create(@Body() dto: CreateCarDto): GeneralResponseDto<CarDto> {
  const car = this.carsService.create(dto);
  return wrapResponse(this.carsAdapter.getDto(car));
}
```

Here:
- `CreateCarDto` is generated from the Zod schema -> it automatically validates the body before executing the `create` function.
- `createResponseDto` dynamically wraps the response in a standard format for Swagger

---

### 3. Validating Query & Path Params with Swagger Support

I've created **custom decorators** `zQuery` and `zParam` that:
- Validate incoming params with Zod
- Throw a `BadRequestException` on validation errors
- Automatically add the parameter to Swagger docs (type, enum, description) (!)

Example:

```ts
@Get()
@ApiOperation({ summary: "List cars" })
@ApiOkResponse({ type: createResponseListDto(CarDto) })
findAll(
  @zQuery("brand", carBrandSchema.optional()) brand?: CarBrand,
  @zQuery("model", carModelSchema.optional()) model?: string,
  @zQuery("skip", z.number().int().min(0).optional()) skip = 0,
  @zQuery("limit", z.number().int().min(1).max(100).optional()) limit = 20,
) {
  const cars = this.carsService.findAll({ brand, model, skip, limit });
  return wrapResponse(this.carsAdapter.getListDto(cars));
}
```

This means:
- Swagger **knows** about the query params, their types, enums and default (if specified)
- Validation happens **before** the controller logic runs
- No duplication between validation and documentation

---

### 4. Dynamic Swagger DTOs for Responses

We use helper functions to dynamically create Swagger DTOs for both single and paginated responses:

```ts
export function createResponseDto<T>(classRef: new () => T) {
  class ResponseDto extends GeneralResponseDto<T> {
    @ApiProperty({ type: classRef })
    data: T;
  }
  return ResponseDto;
}

export function createResponseListDto<T>(classRef: new () => T) {
  class PaginatedItemsDto extends PaginationDto<T> {
    @ApiProperty({ type: classRef, isArray: true })
    items: T[];
  }
  class ResponseListDto extends GeneralResponseDto<PaginationDto<T>> {
    @ApiProperty({ type: PaginatedItemsDto })
    data: PaginationDto<T>;
  }
  return ResponseListDto;
}
```

This ensures:
- All responses follow a **consistent format**
- Swagger shows the **exact shape** of the response, including pagination metadata.
---

## Why Monorepo?

Using a monorepo allows:

- **Shared types** between backend and frontend (e.g., `CarBrand` enum, DTOs, Zod schemas)
- **Single source of truth** for API contracts
- Easier refactoring and dependency management

---

## Setup

Make sure you have **pnpm** installed globally:

```bash
npm install -g pnpm
```

Then:

```bash
# 1. Clone the repository
git clone <your-repo-url>

# 2. Enter the project folder
cd <your-repo-folder>

# 3. Install dependencies
pnpm install

# 4. Start the development environment
pnpm dev
```

---

## License

MIT
