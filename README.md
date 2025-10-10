# Carhub

Carhub is a simple demo project allowing users to create and view cars, but the interesting part is the tech stack used.

The project demonstrates **end-to-end type safety** and **auto-generated documentation** using NestJS, tRPC, Swagger and Zod. The project's goal is to have top tier DX when working with APIs - both in the front and backend.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🏗️ Architecture Overview
![test](/docs/architecture.png)

## 🧑‍💻 Improved DX

### Improved Nestjs Swagger Documentation
- Auto-generated DTOs from Zod schemas
- Compile time error if the Swagger specified DTO and actual DTO are different!
- Custom decorators (`@zQuery`, `@zParam`) for endpoint parameter validation - automatically shows up in swagger too.
- Specified errors your app can throw and each will show up in the documentation.
- If the endpoint performs any validation, `400 Valiation Error` is automatically added to the swagger docs for that endpoint.
- Each endpoint automatically gets `403` (if not an public endpoint), `429` and `500` error examples added.
- [See code examples below!](#-code-examples)


### Better feature development loop
- It's faster and more reliable with tRPC.
  - Types are procedures are immediately updated in the frontend - no codegen needed.
  - Jump between frontend and backend code easily.
  - No more "Where is this endpoint used?" - see directly where each tRPC prodecure is used in the frontend.
  - Backend errors are automatically converted to tRPC errors in middleware.
- A postgres DB and pgadmin are automatically started when starting to develop with `pnpm dev`.

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

# 3. Setup database environment
cp apps/api/.env.test.example apps/api/.env.local
# Edit .env.local with your PostgreSQL credentials

# 4. Seed with sample data
pnpm --filter api seed

# 5. Start both the frontend and backend with
pnpm dev
```

### Sample Data Created
- **2 Users**: `admin`/`admin123` and `jondoe`/`password123`
- **10 Manufacturers**: Toyota, Honda, Ford, BMW, Mercedes-Benz, etc.
- **50 Car Models**: 5 models per manufacturer with slugs
- **Full Relationships**: Proper foreign keys and cascading

## 📖 API Swagger Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3001/docs
- **OpenAPI Spec**: http://localhost:3001/swagger.yml

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

### Custom Validation Decorators
```typescript
@Get(":carId")
async findCars(
  @zParam("carId", z.uuid()) carId: UUID,
  @zQuery("color", z.string().optional()) color?: string,
  @zQuery("minPrice", z.number().min(0).optional()) minPrice?: number,
  @zQuery("skip", z.number().int().gte(0).default(0)) skip = 0,
) {
  // All parameters validated automatically
  // Swagger docs generated automatically
}
```

### tRPC Type Safety
```typescript
// Backend tRPC procedure
getById: procedure
  .input(z.object({ id: z.uuid() })) // id as UUID required
  .query(async ({ input: { id } }) => {
    const car = await this.carsService.findById(id);

    if (!car) {
      // API specific errors are automatically converted to tRPC errors
      throw new AppError(Errors.CAR_NOT_FOUND)
    }

    return this.carsAdapter.getDto(car);
  });

// Frontend usage (fully typed!)
const cars = await trpc.cars.getById.query({
  id: "<UUID>",     // ✅ Typed
});
// Response is automatically typed as well!
```

## 📄 License

MIT - Feel free to use this as inspiration for your own projects!
