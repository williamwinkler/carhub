---
date: 2026-06-19T11:52:03+0200
author: William Winkler
commit: 4f3e983
branch: master
repository: carhub
topic: "API contract package and tRPC/NestJS modernization"
tags: [plan, api-contract, trpc, nestjs, swagger, auth]
status: ready
parent: ".rpiv/artifacts/architecture-reviews/2026-06-19_11-17-37_api-trpc-nestjs-review.md"
phase_count: 6
phases:
  - { n: 1, title: "Create type-only tRPC contract package" }
  - { n: 2, title: "Separate auth surfaces by transport" }
  - { n: 3, title: "Move tRPC onto a Nest-native adapter" }
  - { n: 4, title: "Harden tRPC runtime contracts" }
  - { n: 5, title: "Set up tRPC Jest suite and stabilize runtime contracts" }
  - { n: 6, title: "Document TypeScript vs OpenAPI consumer strategy" }
last_updated: 2026-06-19T12:57:23+0200
last_updated_by: William Winkler
---

# API Contract Package and tRPC/NestJS Modernization Plan

## Overview

This plan updates the repo around the clarified API vision:

- TypeScript consumers interact with the API through tRPC.
- Non-TypeScript consumers use REST controllers and generate clients from Swagger/OpenAPI.
- tRPC is the browser/TypeScript API surface and should use JWT auth only.
- REST controllers are the external/programmatic API surface and should use API keys only.
- The repo should lean into NestJS where possible, so future tRPC work should move from the raw Express adapter toward a Nest-native tRPC adapter.

The plan is grounded in the architecture review at `.rpiv/artifacts/architecture-reviews/2026-06-19_11-17-37_api-trpc-nestjs-review.md` plus the follow-up decisions made after that review.

## Desired End State

- `apps/web` imports tRPC router types from `@repo/api-contract`, not from API internals.
- `@repo/api-contract` is type-only and source-linked for immediate TypeScript LSP feedback.
- tRPC accepts JWT bearer auth only.
- REST controllers accept API keys only.
- tRPC routing/context/middleware use a Nest-native integration pattern instead of a raw Express policy island.
- Important public/auth-sensitive tRPC procedures use runtime `.output(...)` validation.
- tRPC error and rate-limit behavior is explicitly tested and client-visible where needed.
- The API has a Jest suite that separates tRPC caller tests from HTTP `/trpc` e2e tests.
- The tRPC implementation and test helpers include a short architecture-pattern note explaining what to copy and why.
- Swagger remains the language-neutral contract for non-TypeScript consumers.

## What We're NOT Doing

- Do not generate a TypeScript Swagger client for the web app; TypeScript consumers should use tRPC.
- Do not put runtime tRPC client setup inside `@repo/api-contract`; keep it type-only.
- Do not support API keys on tRPC unless a future server-to-server TypeScript use case explicitly requires a separate policy.
- Do not support JWT bearer auth on REST controllers after the controller/API-key split is implemented.
- Do not publish/version the contract package yet; keep it private and workspace-linked.

## Implementation Documentation Rule

When implementing the tRPC architecture phases, add a short, adjacent documentation block for future contributors and LLM agents. The block should live close to the pattern being copied, preferably in `apps/api/src/modules/trpc/README.md` and mirrored or referenced from `apps/api/test/trpc/README.md` or the test helper file.

The block must answer, in plain English:

1. what the repo's tRPC surface is for;
2. where business logic belongs;
3. where authentication, context, errors, and rate limiting belong;
4. which test layer proves which behavior;
5. which files should be copied when adding a new tRPC namespace.

Use this intent as the opening paragraph:

> This API exposes TypeScript-first application behavior through tRPC and language-neutral external behavior through REST/OpenAPI. tRPC procedures should stay thin: validate input/output, apply the shared auth/context/error/rate-limit policy, call Nest services for business logic, and return DTOs. Tests mirror that shape: caller tests prove procedure behavior through the tRPC router, while HTTP e2e tests prove the `/trpc` wire, cookies, headers, and middleware boundary.

---

## Phase 1: Create type-only tRPC contract package

### Overview

Create a stable package boundary for the tRPC type contract and update the web app to consume it. This phase is intentionally low risk: it should not change runtime behavior.

### Changes Required

#### 1. Add `@repo/api-contract`

**Files:**

- `packages/api-contract/package.json`
- `packages/api-contract/tsconfig.json`
- `packages/api-contract/src/index.ts`
- `packages/api-contract/README.md`

**Changes:**

- Create a private workspace package named `@repo/api-contract`.
- Export only TypeScript types:
  - `AppRouter`
  - `RouterInputs`
  - `RouterOutputs`
- Import the source API router type internally with a type-only import.
- Keep the package source-linked so frontend LSP sees API router changes immediately.

#### 2. Add monorepo resolution

**Files:**

- `tsconfig.base.json`
- `pnpm-lock.yaml`

**Changes:**

- Add TS paths for `@repo/api-contract`.
- Update the workspace lockfile so the package is tracked by pnpm.

#### 3. Update web imports

**Files:**

- `apps/web/package.json`
- `apps/web/src/app/_trpc/client.ts`
- `apps/web/src/app/_trpc/Provider.tsx`
- `apps/web/src/app/_trpc/types.ts`
- `apps/web/src/lib/auth-context.tsx`

**Changes:**

- Add `@repo/api-contract` as a workspace dependency.
- Replace direct imports from `@api/modules/trpc/trpc.router` with `@repo/api-contract`.
- Prefer `RouterInputs`/`RouterOutputs` from the package instead of re-inferring those in the web app.

### Success Criteria

#### Automated Verification

- [x] `pnpm --filter @repo/api-contract build` passes.
- [x] `pnpm --filter web build` or `pnpm --filter web exec tsc --noEmit` resolves `@repo/api-contract`.
- [x] `rg "@api/modules/trpc/trpc.router" apps/web/src` returns no matches.
- [x] Web imports from `@repo/api-contract` are type-only.

#### Manual Verification

- [x] In an editor, changing a tRPC procedure type in `apps/api` is reflected through `@repo/api-contract` in `apps/web` without manually rebuilding declarations.
- [x] No runtime code is exported from `@repo/api-contract`.

---

## Phase 2: Separate auth surfaces by transport

### Overview

Make the auth model match the product boundary: tRPC is JWT-only; REST controllers are API-key-only.

### Changes Required

#### 1. Split REST controller authentication from tRPC authentication

**Files:**

- `apps/api/src/common/guards/auth.guard.ts`
- `apps/api/src/modules/trpc/*`
- tests under `apps/api/test` or colocated specs

**Changes:**

- Update REST controller guard behavior so normal controllers authenticate with `x-api-key` only.
- Keep tRPC authenticated procedures on JWT bearer auth only.
- Remove misleading shared assumptions that both transports accept both credential types.

#### 2. Extract credential parsing helpers if useful

**Files:**

- new helper under `apps/api/src/common/auth` or existing auth module

**Changes:**

- Keep reusable parsing/validation helpers small and explicit.
- Avoid one generic guard that silently accepts both JWT and API keys for every transport.

### Success Criteria

#### Automated Verification

- [x] REST controller request with valid API key succeeds.
- [x] REST controller request with JWT bearer but no API key fails.
- [x] tRPC authenticated procedure with valid JWT succeeds.
- [x] tRPC authenticated procedure with API key but no JWT fails.
- [x] Refresh-token tRPC flow still works for the web app.

#### Manual Verification

- [x] API docs or developer README clearly state: TypeScript/tRPC uses JWT; REST/OpenAPI uses API keys.

---

## Phase 3: Move tRPC onto a Nest-native adapter

### Overview

Replace the raw Express tRPC policy island with a Nest-native integration so the repo leans into NestJS conventions for DI, context, middleware, and organization.

### Changes Required

#### 1. Select and install adapter

**Files:**

- `apps/api/package.json`
- `pnpm-lock.yaml`
- tRPC module files

**Changes:**

- Evaluate and adopt a Nest-native tRPC adapter that supports tRPC v11, Zod, Nest DI, context, and middlewares.
- Remove or shrink manual `createExpressMiddleware` mounting once the adapter owns routing.

#### 2. Migrate router declarations incrementally

**Files:**

- `apps/api/src/modules/trpc/trpc.router.ts`
- `apps/api/src/modules/auth/auth.trpc.ts`
- `apps/api/src/modules/accounts/accounts.trpc.ts`
- `apps/api/src/modules/cars/cars.trpc.ts`
- `apps/api/src/modules/car-models/car-models.trpc.ts`
- `apps/api/src/modules/car-manufacturers/car-manufacturers.trpc.ts`

**Changes:**

- Preserve public namespace names: `auth`, `accounts`, `cars`, `carModels`, `carManufacturers`.
- Preserve `AppRouter` type export through the contract package.
- Migrate one namespace at a time if the adapter supports mixed operation; otherwise perform one coordinated migration with tests.

#### 3. Move context and middleware into Nest-native constructs

**Files:**

- `apps/api/src/modules/trpc/trpc.service.ts`
- `apps/api/src/modules/trpc/trpc.middleware.ts`
- adapter-specific context/middleware classes

**Changes:**

- Represent JWT principal in typed tRPC context.
- Keep CLS only as a service-layer bridge if services still need `Ctx`.
- Use Nest DI for auth/rate-limit middleware dependencies.

### Success Criteria

#### Automated Verification

- [x] Existing web tRPC calls typecheck against the migrated `AppRouter`.
- [x] `/trpc` endpoint remains available at the same URL.
- [x] JWT-protected tRPC procedures still work.
- [x] Public tRPC queries still work without JWT.
- [x] No web import path changes are required beyond `@repo/api-contract`.

#### Manual Verification

- [x] The tRPC/Nest integration is easier to explain: routers, context, and middleware are Nest providers/decorators rather than a raw Express island.

---

## Phase 4: Harden tRPC runtime contracts

### Overview

Add pragmatic runtime output validation where it protects public data and auth-sensitive flows without adding unnecessary friction everywhere.

### Changes Required

#### 1. Add output schemas for high-risk procedures

**Files:**

- auth/account/car DTO/schema files
- `apps/api/src/modules/auth/auth.trpc.ts`
- `apps/api/src/modules/accounts/accounts.trpc.ts`
- `apps/api/src/modules/cars/cars.trpc.ts`

**Changes:**

- Add `.output(...)` for auth responses, account responses, car DTOs, and paginated car lists.
- Ensure output schemas expose DTO fields only, not TypeORM entity internals.

#### 2. Apply output validation to lower-risk public list procedures

**Files:**

- `apps/api/src/modules/car-models/car-models.trpc.ts`
- `apps/api/src/modules/car-manufacturers/car-manufacturers.trpc.ts`

**Changes:**

- Add output schemas for public model/manufacturer lists after the shared pagination shape is defined.

#### 3. Fix known procedure contract issues

**Files:**

- `apps/api/src/modules/accounts/accounts.trpc.ts`
- `apps/api/src/modules/cars/cars.trpc.ts`
- `apps/api/src/modules/cars/cars.service.ts`

**Changes:**

- Replace `user!` in `accounts.getMe` with explicit error handling.
- Ensure `cars.toggleFavorite` returns the post-toggle state or renames the field to reflect previous state.
- Normalize pagination defaults across list procedures or document intentional differences.

### Success Criteria

#### Automated Verification

- [x] Output schema validation passes for representative auth/account/car/model/manufacturer procedures.
- [x] A test proves sensitive entity-only fields cannot leak through tRPC DTO outputs.
- [x] `accounts.getMe` returns a structured error for stale/deleted-user tokens.
- [x] `toggleFavorite` response semantics are tested.

#### Manual Verification

- [x] Developers can still add simple procedures without excessive boilerplate, using shared DTO/output schema helpers.

---

## Phase 5: Set up tRPC Jest suite and stabilize runtime contracts

### Overview

Turn the tRPC security, error, and rate-limit behavior into explicit, tested contracts. The test suite should make the architecture obvious: business logic is tested through Nest services where appropriate, procedure behavior is tested through the tRPC router caller, and wire behavior is tested through HTTP `/trpc` e2e tests.

### Changes Required

#### 1. Create the Jest project structure expected by package scripts

**Files:**

- `apps/api/test/jest.base.config.js`
- `apps/api/test/jest-unit.config.js`
- `apps/api/test/jest-integration.config.js`
- `apps/api/test/jest-e2e.config.js`
- `apps/api/test/setup/env.ts`
- `apps/api/test/setup/jest.ts`

**Changes:**

- Keep the existing package scripts in `apps/api/package.json` working.
- Use Jest projects so unit, integration, and e2e tests can run independently or together.
- Configure `ts-jest`, `testEnvironment: "node"`, `moduleNameMapper` for `@api/*`, and setup files for environment and shared Jest behavior.
- Use `maxWorkers: 1` for integration/e2e projects if database, cache, auth, or rate-limit state can collide in parallel.

#### 2. Add tRPC test helpers

**Files:**

- `apps/api/test/helpers/trpc-context.ts`
- `apps/api/test/helpers/trpc-caller.ts`
- `apps/api/test/helpers/test-app.ts`
- `apps/api/src/bootstrap/configure-app.ts` or equivalent shared app bootstrap helper

**Changes:**

- Add a `mockTrpcContext()` helper for caller tests. It should create the same context shape the app uses (`req`, `res`, headers, cookies, socket IP, `setHeader`, `cookie`).
- Add a `createTrpcCaller()` helper that retrieves the real `TrpcRouter.appRouter` from a Nest `TestingModule` and uses tRPC's `createCallerFactory()` or `router.createCaller()` pattern.
- Add a `createTestApp()` helper for HTTP e2e tests. It should apply the same app setup as `main.ts`: JSON parsing, cookie parsing, global pipes, and tRPC mounting or the Nest-native adapter equivalent after Phase 3.
- Extract shared bootstrap code from `main.ts` if needed so production and tests do not drift.

#### 3. Add caller-level tRPC integration tests

**Files:**

- `apps/api/test/trpc/auth.trpc.spec.ts`
- `apps/api/test/trpc/accounts.trpc.spec.ts`
- `apps/api/test/trpc/cars.trpc.spec.ts`
- optional namespace specs for `carModels` and `carManufacturers`

**Changes:**

- Use tRPC caller tests for procedure behavior without HTTP serialization noise.
- Cover public queries without auth.
- Cover JWT-protected procedures with valid and missing bearer tokens.
- Prove API keys are rejected on tRPC.
- Prove `AppError` maps to the expected tRPC error metadata.
- Prove `.output(...)` schemas reject accidental entity/internal fields once Phase 4 lands.
- Prove known procedure contract fixes such as `accounts.getMe` stale-user errors and `cars.toggleFavorite` post-state semantics.

#### 4. Add HTTP `/trpc` e2e smoke tests

**Files:**

- `apps/api/test/trpc/trpc.e2e-spec.ts`

**Changes:**

- Use Nest `TestingModule` plus Supertest or a real `@trpc/client` pointed at the test server.
- Prefer `@trpc/client` for procedure calls so tests follow the official tRPC wire protocol instead of hand-rolling request bodies.
- Reserve HTTP e2e tests for behavior that caller tests cannot prove: mount path, headers, cookies, refresh-token flow, batching if used, and final wire error shape.

#### 5. Stabilize tRPC error formatting

**Files:**

- tRPC factory/context files after adapter migration
- `apps/api/src/common/errors/*`
- web error handling if needed

**Changes:**

- Use tRPC `errorFormatter` or adapter equivalent to expose stable `errorCode` and validation details.
- Keep client-visible tRPC error handling aligned with REST `ErrorDto` concepts without forcing identical wire shape.
- Add tests that assert client-visible error metadata, not only thrown class names.

#### 6. Fix rate-limit identity and buckets

**Files:**

- `apps/api/src/modules/trpc/trpc-rate-limit.service.ts`
- tRPC middleware/context files
- tRPC tests

**Changes:**

- Key authenticated tRPC rate limits by JWT principal.
- Key anonymous public procedures by IP.
- Decide and encode whether rate limits are per identity globally, per procedure, or per tier.
- Prefer atomic counters if the cache backend supports them.
- Add tests for anonymous and authenticated callers, including the current `ctx.principal` vs CLS mismatch risk.

#### 7. Add architecture-pattern text for future LLMs and contributors

**Files:**

- `apps/api/src/modules/trpc/README.md`
- `apps/api/test/trpc/README.md` or comments in `apps/api/test/helpers/trpc-caller.ts`

**Changes:**

- Add the implementation documentation block from this plan's “Implementation Documentation Rule”.
- Include a “copy this pattern” checklist for adding a new tRPC namespace:
  - create/extend DTO and Zod input/output schemas;
  - add a thin router/procedure class;
  - keep business logic in the Nest service;
  - use the correct base procedure for public/JWT-protected/admin behavior;
  - add caller tests for procedure behavior;
  - add HTTP e2e only for wire/cookie/header behavior.

### Success Criteria

#### Automated Verification

- [x] `pnpm --filter api test:unit` runs the unit project.
- [x] `pnpm --filter api test:integration` runs tRPC caller/integration tests.
- [x] `pnpm --filter api test:e2e` runs HTTP `/trpc` e2e tests.
- [x] tRPC AppError responses expose stable domain error metadata.
- [x] tRPC auth tests prove JWT-only behavior.
- [x] REST auth tests prove API-key-only behavior.
- [x] Rate-limit tests cover anonymous and authenticated callers.
- [x] Output validation tests prove entity-only fields cannot leak through tRPC DTOs.
- [x] Existing API test suites still pass.

#### Manual Verification

- [ ] Frontend error toasts can branch on stable error metadata instead of message text when needed.
- [x] A future contributor or LLM can read the tRPC README/test-helper note and correctly add a new namespace with matching business-logic and test patterns.

---

## Phase 6: Document TypeScript vs OpenAPI consumer strategy

### Overview

Make the repo's API-consumer strategy explicit so future contributors do not generate redundant clients or mix auth models.

### Changes Required

#### 1. Document consumer paths

**Files:**

- root `README.md` or API docs
- `packages/api-contract/README.md`
- Swagger/OpenAPI docs if present

**Changes:**

- State that TypeScript consumers use tRPC and `@repo/api-contract`.
- State that non-TypeScript consumers use REST/OpenAPI and API keys.
- State that a future runtime tRPC client package should be separate from `@repo/api-contract` if needed.

#### 2. Reserve future package boundaries

**Potential future packages:**

- `@repo/api-contract`: type-only tRPC contract.
- `@repo/api-trpc-client`: optional runtime TypeScript tRPC client factory.
- No TypeScript Swagger client by default.

### Success Criteria

#### Automated Verification

- [x] Documentation references `@repo/api-contract` for TypeScript tRPC usage.
- [x] No generated TypeScript Swagger client is introduced.

#### Manual Verification

- [x] A contributor can answer which API surface to use based on language and auth model:
  - TypeScript + user/session flow → tRPC/JWT.
  - Non-TypeScript or external programmatic integration → REST/OpenAPI/API key.

---

## Testing Strategy

### Automated

- `pnpm --filter @repo/api-contract build`
- `pnpm --filter web exec tsc --noEmit` or the project-approved web typecheck/build command
- `pnpm --filter api test`
- `pnpm --filter api test:unit`
- `pnpm --filter api test:integration`
- `pnpm --filter api test:e2e`
- tRPC caller tests added in Phase 5 for procedure behavior
- HTTP `/trpc` e2e tests added in Phase 5 for wire, cookie, header, and middleware behavior

### Manual

1. Start API and web locally.
2. Confirm web tRPC calls still compile and execute.
3. Confirm frontend JWT refresh flow still works.
4. Confirm REST controller auth behavior matches API-key-only policy after Phase 2.
5. Confirm Swagger/OpenAPI docs remain the non-TypeScript client-generation path.
6. Confirm the tRPC README/test-helper note gives enough context for another contributor or LLM to copy the router/service/test pattern.

## Performance Considerations

- Source-linked `@repo/api-contract` optimizes local DX and LSP feedback.
- `.output(...)` validation adds runtime cost; apply it first to public/auth-sensitive procedures and DTO/entity boundaries.
- Atomic rate limiting may require Redis or a cache backend with increment semantics for production accuracy.

## Migration Notes

- Phase 1 is additive and should not change runtime behavior.
- Phase 2 changes auth behavior and should be coordinated with any existing REST callers that currently use JWT.
- Phase 3 may be the highest-risk implementation phase because it changes the tRPC integration adapter.
- Phase 4 may change public tRPC response semantics and should be coordinated with web updates.

## Developer Context

Follow-up decisions captured after the architecture review:

- tRPC should support JWT only.
- Normal NestJS controllers should support API keys only.
- Prefer a Nest-native tRPC adapter over maintaining a raw Express tRPC island.
- `.output(...)` is worth using pragmatically for public/auth-sensitive/entity-derived responses because it prevents accidental leaks and catches DTO drift.
- TypeScript consumers should use tRPC; non-TypeScript consumers should use Swagger/OpenAPI.
- A future generated REST client, if any, should be separate from `@repo/api-contract` and should not replace tRPC for TypeScript consumers.
- tRPC tests should be layered: unit tests for isolated service/helper logic, caller tests for procedure behavior, and HTTP e2e tests only for `/trpc` wire concerns such as headers, cookies, batching, and final error shape.
- Implementation should add an adjacent architecture-pattern note so future LLMs and contributors can copy the intended tRPC business-logic and testing pattern.

## References

- Architecture review: `.rpiv/artifacts/architecture-reviews/2026-06-19_11-17-37_api-trpc-nestjs-review.md`
- tRPC Express Adapter: <https://trpc.io/docs/server/adapters/express>
- tRPC Authorization: <https://trpc.io/docs/server/authorization>
- tRPC Middlewares: <https://trpc.io/docs/server/middlewares>
- tRPC Error Formatting: <https://trpc.io/docs/server/error-formatting>
- tRPC Server Side Calls / caller testing: <https://trpc.io/docs/server/server-side-calls>
- tRPC HTTP RPC Specification: <https://trpc.io/docs/rpc>
- NestJS Testing: <https://docs.nestjs.com/fundamentals/testing>
- NestJS Request lifecycle: <https://docs.nestjs.com/faq/request-lifecycle>
- NestJS Guards: <https://docs.nestjs.com/guards>
- NestJS-tRPC Context: <https://www.nestjs-trpc.io/docs/context>
- NestJS-tRPC Middlewares: <https://www.nestjs-trpc.io/docs/middlewares>
- Jest Configuration: <https://jestjs.io/docs/configuration>
