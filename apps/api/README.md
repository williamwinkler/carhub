# Carhub API

NestJS API for Carhub. The app exposes two intentional API surfaces:

- **tRPC for first-party TypeScript consumers:** JWT bearer auth, type contract exported through `@repo/api-contract`.
- **REST/OpenAPI for non-TypeScript or external programmatic consumers:** `x-api-key` auth, Swagger/OpenAPI available at `/docs` and `/swagger.yml`.

Do not mix the auth models by default. tRPC should not accept API keys, and protected REST controllers should not accept JWT bearer tokens.

## Choosing tRPC vs REST/OpenAPI

| Consumer                                                                  | Prefer                                                                         | Why                                                                                                                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First-party TypeScript app in this workspace, such as `apps/web`          | tRPC through `@repo/api-contract`                                              | Best TS-to-TS DX: native inferred inputs/outputs, direct editor navigation from frontend usage to backend procedure source, and no generated-client drift. |
| External, public, partner, CLI, mobile, or non-TypeScript consumer        | REST/OpenAPI through Swagger                                                   | Best language-neutral contract: HTTP resources, generated SDKs for many languages, stable docs, and auth with API keys.                                    |
| A TypeScript app outside this monorepo that cannot import workspace types | REST/OpenAPI generated client, or design a separate published contract package | Swagger generation is better when the client cannot share the live TypeScript router type safely.                                                          |

Use tRPC for first-party TS-to-TS product code. Use Swagger/OpenAPI when the goal is generated clients, public documentation, or cross-language integration.

## tRPC architecture

The tRPC implementation uses explicit/plain tRPC router factories mounted inside
Nest with the official `@trpc/server` Express middleware. Nest still owns DI,
modules, services, repositories, config, and testing setup; tRPC owns the
TypeScript-first API contract and procedure middleware chain.

Key files:

- `src/modules/trpc/trpc.service.ts` owns `initTRPC`, base procedures, auth/admin checks, AppError mapping, and rate limiting.
- `src/modules/trpc/trpc.context.ts` builds the JWT-only tRPC request context.
- `src/modules/trpc/trpc.router.ts` composes the real runtime `AppRouter` and mounts `/trpc`.
- `src/modules/**/*.trpc.ts` contain thin explicit router factories such as `createCarsRouter(...)`.
- `src/modules/trpc/README.md` documents the copy-this pattern for new namespaces.
- `@repo/api-contract` re-exports the real `AppRouter` type for TypeScript consumers.

There is no tRPC code generation step. The explicit router source is the type
source, so editor navigation and resolver input inference stay native to tRPC.

## Tests

The API uses separate Jest projects:

```bash
pnpm --filter api test:unit
pnpm --filter api test:integration
pnpm --filter api test:e2e
pnpm --filter api test
```

Test layer intent:

- Unit specs cover isolated service/guard behavior, including API-key-only REST auth.
- tRPC integration specs call the real explicit tRPC router with mocked service boundaries.
- HTTP e2e specs start a Nest test app and use `@trpc/client` for `/trpc` wire behavior.

## Local development

```bash
pnpm install
cp apps/api/.env.example apps/api/.env.local

# Start local Postgres + pgAdmin through Docker Compose.
# Requires Docker. Uses the default local credentials from docker-compose.yml.
pnpm dev:db

pnpm --filter api migrations:run
pnpm --filter api dev
```

`pnpm dev` starts the API and web dev servers only; it does not start Docker
containers. Run `pnpm dev:db` separately when using the local Docker database.

Swagger UI is available at `http://localhost:3001/docs` in development.
