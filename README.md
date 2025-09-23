# NestJS + tRPC + Zod + Swagger Demo 🚀

> **A demonstration project showcasing modern API development patterns for inspiration**

This project demonstrates **end-to-end type safety** and **auto-generated documentation** using NestJS, tRPC, and Zod. Perfect for developers looking to build production-ready APIs with excellent developer experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Key Highlights

### 🔥 Schema-First Development with Zod
- **Single source of truth** for validation, types, and documentation
- **Custom decorators** (`@zQuery`, `@zParam`) for automatic parameter validation
- **Auto-generated DTOs** from Zod schemas for Swagger

### 🛡️ Dual API Architecture
- **REST API** with full OpenAPI/Swagger docs for external integrations
- **tRPC endpoints** for type-safe frontend communication
- **Same business logic** powering both APIs

### 📚 Auto-Generated Documentation
- **Interactive Swagger UI** at `/docs` (development)
- **OpenAPI YAML** export for external tools
- **Parameter docs** auto-generated from Zod schemas
- **Consistent response** format across all endpoints

### 🔒 Production-Ready Features
- **JWT authentication** with refresh tokens
- **Role-based authorization** (`@Roles()` decorator)
- **Tiered rate limiting** (public, auth, strict, burst protection)
- **TypeORM integration** with PostgreSQL
- **Comprehensive error handling**

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   NestJS API     │    │   Database      │
│   (Next.js)     │◄──►│   + tRPC         │◄──►│   (PostgreSQL)  │
│                 │    │   + Swagger      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚗 Demo: Car Dealership API

The demo implements a car dealership management system with:

- **Authentication**: JWT login/logout with role-based access
- **User Management**: Admin and regular user roles
- **Car Manufacturers**: Toyota, BMW, Mercedes-Benz, etc.
- **Car Models**: Camry, X5, C-Class, etc. (with URL-friendly slugs)
- **Car Listings**: Full CRUD with owner restrictions and favorites
- **Advanced Filtering**: Search by model, color, price range, etc.

## 🛠️ Tech Stack

- **Backend**: NestJS + tRPC + TypeORM + PostgreSQL
- **Validation**: Zod schemas (single source of truth)
- **Documentation**: Auto-generated Swagger/OpenAPI
- **Authentication**: JWT with refresh tokens & API keys
- **Database**: TypeORM with PostgreSQL
- **Testing**: Jest with test coverage

## ⚡ Quick Start

### Prerequisites
- Node.js 24+
- Docker installed and running
- pnpm (`npm install -g pnpm`)

### Installation (Development)

```bash
# 1. Clone the repository
git clone https://github.com/williamwinkler/trpc-nestjs-nextjs-demo.git
cd trpc-nestjs-nextjs-demo

# 2. Install dependencies
pnpm install

# 3. Setup database environment
cp apps/api/.env.example apps/api/.env.local
# Edit .env.local with your PostgreSQL credentials

# 5. Seed with sample data
pnpm --filter api seed

# 6. Start the API server
pnpm dev:api
```

### Sample Data Created
- **2 Users**: `admin`/`admin123` and `jondoe`/`password123`
- **10 Manufacturers**: Toyota, Honda, Ford, BMW, Mercedes-Benz, etc.
- **50 Car Models**: 5 models per manufacturer with slugs
- **Full Relationships**: Proper foreign keys and cascading

## 📖 API Documentation

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
@ApiEndpoint({
  summary: "Create a car",
  type: CarDto,
})
async create(@Body() dto: CreateCarDto) {
  // dto is validated and typed automatically!
}
```

### Custom Validation Decorators
```typescript
@Get()
async findCars(
  @zQuery("color", z.string().optional()) color?: string,
  @zQuery("minPrice", z.number().min(0).optional()) minPrice?: number,
  @zQuery("skip", z.number().int().gte(0).default(0)) skip = 0,
) {
  // All parameters validated automatically
  // Swagger docs generated automatically
  // TypeScript types inferred automatically
}
```

### tRPC Type Safety
```typescript
// Backend tRPC procedure
findAll: procedure
  .input(carQuerySchema)
  .query(async ({ input }) => {
    return carsService.findAll(input);
  });

// Frontend usage (fully typed!)
const cars = await trpc.cars.findAll.query({
  color: "red",     // ✅ Typed
  minPrice: 20000,  // ✅ Typed
  skip: 0           // ✅ Typed
});
// Response is automatically typed!
```

## 🔥 What Makes This Special?

1. **Zero Code Generation**: Types flow naturally from Zod schemas
2. **DRY Principle**: Write validation once, get types + docs + runtime validation
3. **Developer Experience**: Full IntelliSense from database to frontend
4. **Production Ready**: Authentication, rate limiting, error handling built-in
5. **Dual API Strategy**: REST for integrations, tRPC for type safety
6. **Auto Documentation**: Always up-to-date API specs

## 📁 Project Structure

```
├── apps/
│   ├── api/                    # NestJS API
│   │   ├── src/
│   │   │   ├── common/         # Shared utilities, guards, decorators
│   │   │   ├── modules/        # Feature modules (auth, cars, etc.)
│   │   │   └── main.ts         # App bootstrap
│   │   └── swagger.yml         # Generated OpenAPI spec
│   └── web/                    # Next.js frontend (in development)
└── packages/
    └── shared/                 # Shared types and utilities
```

## 🎨 Use as Inspiration

This project demonstrates patterns for:
- **Schema-driven development** with Zod
- **Automatic API documentation** from schemas
- **Type-safe APIs** with tRPC
- **Production-ready security** and rate limiting
- **Clean architecture** with NestJS
- **Database integration** with TypeORM

Perfect starting point for building modern, type-safe APIs with excellent developer experience!

## 📄 License

MIT - Feel free to use this as inspiration for your own projects!
