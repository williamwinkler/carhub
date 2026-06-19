---
template_version: 1
date: 2026-06-19T11:17:37+0200
author: William Winkler
commit: 4f3e983
branch: master
repository: carhub
target: apps/api/src/modules/trpc + apps/api/src/modules/*/*.trpc.ts
target_kind: module
layer_count: 5
unresolved_finding_count: 0
status: ready
tags: [architecture-review, api, trpc, nestjs, auth, middleware, rate-limiting]
last_updated: 2026-06-19T11:17:37+0200
last_updated_by: William Winkler
last_updated_note: "Initial RPIV review of NestJS tRPC integration and exposed procedures"
phases:
  - {
      n: 1,
      title: "Make the tRPC/NestJS policy boundary explicit",
      depends_on: [],
      blast_radius: internal,
      effort: M,
    }
  - {
      n: 2,
      title: "Move auth identity into typed tRPC context",
      depends_on: [1],
      blast_radius: internal,
      effort: M,
    }
  - {
      n: 3,
      title: "Stabilize tRPC error and rate-limit contracts",
      depends_on: [2],
      blast_radius: public-API,
      effort: M,
    }
  - {
      n: 4,
      title: "Harden feature procedure contracts",
      depends_on: [2, 3],
      blast_radius: public-API,
      effort: M,
    }
  - {
      n: 5,
      title: "Publish router types through a stable boundary",
      depends_on: [4],
      blast_radius: cross-module,
      effort: S,
    }
---

# Architecture review — API tRPC + NestJS integration

This review covers how `apps/api` integrates tRPC into the NestJS runtime and how feature modules expose tRPC queries/mutations. The focus is the `/trpc` public contract, Nest module wiring, root router composition, middleware/error/auth/rate-limit foundations, and the feature routers that expose procedures. It explicitly calls out where the implementation follows tRPC/NestJS best practice, where it diverges, and how the target pattern should look.

---

## Best-practice basis

The review uses current tRPC v11/NestJS documentation as the expected baseline:

- tRPC's Express adapter expects `createExpressMiddleware({ router, createContext })` mounted under a path such as `/trpc`; `createContext` is created per incoming request.
- tRPC authorization is normally expressed as reusable base procedures/middlewares that read typed request context, throw `TRPCError`, and refine context with `next({ ctx: ... })` so downstream handlers know `ctx.user`/`ctx.principal` is non-null.
- tRPC error shape customization belongs in `initTRPC.create({ errorFormatter })` when clients need stable structured fields beyond the default code/message/http status.
- NestJS request lifecycle applies middleware → guards → interceptors → pipes → handler → interceptors → filters for Nest-routed requests. A raw Express tRPC middleware must not be assumed to receive Nest controller guards/interceptors/filters unless an adapter explicitly integrates them.
- NestJS-tRPC style adapters can integrate context/middleware classes with Nest dependency injection, but raw `@trpc/server/adapters/express` is also valid if the tRPC pipeline owns its own policies explicitly.

References: tRPC Express Adapter, Authorization, Middlewares, Error Formatting; NestJS Request Lifecycle and Guards; NestJS-tRPC Context and Middlewares.

---

## Conventions

### Finding shape

Each finding is a level-3 heading `### L<layer>-<seq> — <title>` followed by fields.

| Field                                     | Meaning                                                |
| ----------------------------------------- | ------------------------------------------------------ |
| **Evidence**                              | `file.ext:lineA-lineB` plus a short quote when useful  |
| **Current state**                         | what the code does today                               |
| **Best-practice alignment**               | what is good and should be preserved                   |
| **Desired state / how it should be done** | the expected target shape                              |
| **Proposed improvement**                  | concrete action                                        |
| **Severity**                              | Low / Med / High                                       |
| **Effort**                                | S / M / L                                              |
| **Blast radius**                          | `internal` / `public-API` / `on-disk` / `cross-module` |
| **Class**                                 | `polish` vs `redesign`                                 |
| **Status**                                | review disposition                                     |
| **Depends on**                            | other finding IDs                                      |
| **Cross-cut tag**                         | theme tag                                              |

### Status legend

- `accepted — recommended` means the review recommends landing it in the polish plan.
- `accepted — preserve` means the code follows the expected pattern and should be kept as a precedent.
- `deferred` means valid but not necessary for the next polish pass.

### Layers (top → down)

| #   | Layer                                                     | Files                                                                                                                                                                            |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Public mount + client type contract                       | `apps/api/src/main.ts`, `apps/api/src/modules/trpc/trpc.router.ts`, `apps/web/src/app/_trpc/client.ts`, `apps/web/src/app/_trpc/Provider.tsx`, `apps/web/src/app/_trpc/types.ts` |
| 1   | NestJS module composition                                 | `apps/api/src/app.module.ts`, `apps/api/src/modules/trpc/trpc.modules.ts`, feature `*.module.ts` tRPC provider exports                                                           |
| 2   | Root tRPC router                                          | `apps/api/src/modules/trpc/trpc.router.ts`                                                                                                                                       |
| 3   | Procedure, middleware, error, auth, rate-limit foundation | `trpc.service.ts`, `trpc.middleware.ts`, `trpc-rate-limit.service.ts`, `trpc.consts.ts`, related REST guards/filter for parity                                                   |
| 4   | Feature query/mutation routers                            | `auth.trpc.ts`, `accounts.trpc.ts`, `cars.trpc.ts`, `car-models.trpc.ts`, `car-manufacturers.trpc.ts`                                                                            |

---

## Methodology principles

### M1 — Raw tRPC adapter means tRPC owns the policy pipeline

**Origin:** L0-01 and L3-01.

**Rule.** Mounting tRPC through `createExpressMiddleware` inside NestJS is valid, but it creates a second request pipeline. Do not rely on Nest controller guards, interceptors, filters, or serializers for tRPC procedures. Either adopt a Nest-native tRPC adapter/decorator model, or make the tRPC pipeline explicit and complete: context, auth, roles, error shape, input/output validation, observability, and rate limiting.

**Apply to (keep):** explicit tRPC middleware/procedure factories in `TrpcService`.

**Apply to (drop / change):** comments/configuration that imply Nest global pipes/interceptors/filters cover tRPC automatically.

### M2 — Auth identity belongs in typed tRPC context

**Origin:** L3-02 and L3-03.

**Rule.** tRPC best practice is to build request identity in `createContext` or context middleware, then refine it through protected procedures with `next({ ctx })`. CLS can still support service-layer code, but the tRPC contract itself should expose typed identity (`ctx.principal`, `ctx.auth`, or `ctx.user`) so auth, rate limiting, roles, logging, and handlers all read the same source of truth.

**Apply to (keep):** reusable `authenticatedProcedure`, `authenticatedShortProcedure`, and `authenticatedMediumProcedure` concepts.

**Apply to (drop / change):** hidden identity stored only in global CLS while tRPC context remains `{ req, res }`.

### M3 — Router types are public API

**Origin:** L0-02.

**Rule.** `AppRouter` is the generated client contract. It should be exported through a stable package or barrel boundary, not deep-imported from API internals by web clients. Treat changes to router names, procedure names, inputs, outputs, and error shapes as public API changes.

**Apply to (keep):** type-only AppRouter consumption from the web app.

**Apply to (drop / change):** direct web imports from `@api/modules/trpc/trpc.router`.

---

## Layer 0 — Public mount + client type contract

Files: `apps/api/src/main.ts`, `apps/api/src/modules/trpc/trpc.router.ts`, `apps/web/src/app/_trpc/client.ts`, `apps/web/src/app/_trpc/Provider.tsx`, `apps/web/src/app/_trpc/types.ts`.

### Best-practice alignment

- The runtime uses the official tRPC Express adapter shape: `app.use('/trpc', createExpressMiddleware({ router, createContext }))` in `trpc.router.ts:32-37`.
- `main.ts` applies cookies and credentials-friendly CORS before mounting tRPC, which supports the refresh-token flow (`main.ts:23-39`, `main.ts:50-52`, `Provider.tsx:20-23`, `Provider.tsx:70-77`).
- The web app uses `AppRouter` as a type-only contract for `createTRPCReact<AppRouter>()`, preserving end-to-end type inference (`client.ts:1-4`).

### L0-01 — Raw `/trpc` mount is valid, but the NestJS policy boundary is implicit

**Evidence**

`apps/api/src/main.ts:54`, `apps/api/src/main.ts:78-79`, `apps/api/src/modules/trpc/trpc.router.ts:32-37`, `apps/api/src/app.module.ts:66-96`

```ts
app.useGlobalPipes(new ZodValidationPipe()); // for tRPC
const trpcRouter = app.get(TrpcRouter);
await trpcRouter.applyMiddleware(app);
```

**Current state**

The API mounts tRPC as raw Express middleware from Nest bootstrap. Separately, `AppModule` registers Nest global pipes, interceptors, guards, and filters. The tRPC procedures do have their own middleware chain, but the code/commentary does not make the split explicit.

**Best-practice alignment**

Using `createExpressMiddleware` is an official tRPC pattern, and resolving the router through Nest DI preserves access to feature services.

**Desired state / how it should be done**

Pick one integration model and document/enforce it:

1. **Raw adapter model:** `/trpc` is its own pipeline. tRPC owns auth, role checks, validation, serialization/output checks, error formatting, rate limiting, logging, and tracing.
2. **Nest-native adapter model:** use a NestJS-tRPC adapter/decorator approach when the goal is to reuse Nest DI, context classes, and middleware-like classes more declaratively.

Do not imply Nest global controller pipeline elements automatically protect or serialize tRPC procedures.

**Proposed improvement**

Document the raw-adapter boundary in `TrpcModule`/`TrpcRouter`, remove the misleading `// for tRPC` global-pipe comment, and add a test that proves a tRPC error/auth/rate-limit response is shaped by the tRPC pipeline rather than Nest filters/interceptors.

- **Severity:** Med
- **Effort:** S
- **Blast radius:** internal
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** none
- **Cross-cut tag:** `T1-policy-boundary`

### L0-02 — `AppRouter` is deep-imported from API internals by the web app

**Evidence**

`apps/api/src/modules/trpc/trpc.router.ts:43`, `apps/web/src/app/_trpc/client.ts:1-4`, `apps/web/src/app/_trpc/Provider.tsx:3`

```ts
export type AppRouter = TrpcRouter["appRouter"];
import type { AppRouter } from "@api/modules/trpc/trpc.router";
```

**Current state**

The web client imports `AppRouter` directly from the API module implementation path.

**Best-practice alignment**

The import is type-only and gives the web app end-to-end tRPC inference.

**Desired state / how it should be done**

Expose router types through a stable contract boundary, such as `@api/trpc` or a dedicated workspace package (`@repo/api-contracts`). The web app should depend on a public type export, not on the physical internal location of the Nest module.

**Proposed improvement**

Create a public barrel/package that exports `AppRouter`, `RouterInputs`, and `RouterOutputs`; update web imports to use that stable boundary.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** cross-module
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** L4-01
- **Cross-cut tag:** `T3-public-contract`

### Layer 0 — tally

| Status    | Count |
| --------- | ----: |
| accepted  |     2 |
| rejected  |     0 |
| deferred  |     0 |
| withdrawn |     0 |

Cross-cutting tags introduced: `T1-policy-boundary`, `T3-public-contract`.
Cross-cutting tags reused: none.

Dependency edges within Layer 0:

- L0-02 depends on L4-01 to avoid publishing unstable response contracts prematurely.

---

## Layer 1 — NestJS module composition

Files: `apps/api/src/app.module.ts`, `apps/api/src/modules/trpc/trpc.modules.ts`, feature module provider exports.

### Best-practice alignment

- Feature modules own their tRPC provider next to their controller/service (`AuthTrpc`, `CarsTrpc`, `CarModelsTrpc`, `CarManufacturersTrpc`, `AccountsTrpc`). This keeps procedure handlers close to the domain service and DTO adapter.
- `TrpcRouter` composes feature routers through DI rather than constructing services manually.
- The `TrpcRateLimitService` is injectable and uses Nest's cache manager, which is a good direction for cross-procedure policy infrastructure.

### L1-01 — `TrpcModule` is global and re-imports all feature modules

**Evidence**

`apps/api/src/modules/trpc/trpc.modules.ts:11-21`, `apps/api/src/app.module.ts:30-63`

```ts
@Global()
@Module({
  imports: [
    AuthModule,
    CarsModule,
    CarModelsModule,
    CarManufacturersModule,
    AccountsModule,
  ],
  providers: [TrpcService, TrpcRouter, TrpcRateLimitService],
  exports: [TrpcService, TrpcRateLimitService],
})
export class TrpcModule {}
```

**Current state**

`TrpcModule` is a global composition module importing every feature module, while `AppModule` also imports those same feature modules. Auth/accounts already need `forwardRef`, so the current shape increases coupling pressure.

**Best-practice alignment**

A single root router module is appropriate for tRPC because there must be one exported `AppRouter` contract.

**Desired state / how it should be done**

Keep a root tRPC composition point, but avoid global scope unless providers truly must be ambient. Prefer explicit module imports and a clear direction:

- Feature modules provide/export their `XTrpc` router providers.
- `TrpcModule` imports those feature modules and composes `AppRouter`.
- `AppModule` imports `TrpcModule` and feature modules only where REST/controllers need them, avoiding duplicate composition where possible.

**Proposed improvement**

Remove `@Global()` unless a concrete consumer needs ambient `TrpcService`; audit duplicate imports; keep `TrpcService` exported only to feature modules that declare tRPC providers.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** internal
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** L0-01
- **Cross-cut tag:** `T1-policy-boundary`

### L1-02 — No tRPC-specific tests were found

**Evidence**

Repository search found no `*trpc*.spec.ts`, `*trpc*.test.ts`, or `test/**/*trpc*` under `apps/api`.

**Current state**

The code has procedure, auth, error, and rate-limit behavior but no visible tests at the tRPC boundary.

**Best-practice alignment**

The feature routers are thin enough to be testable via `appRouter.createCaller()` for logic and via Supertest/HTTP for Express integration behavior.

**Desired state / how it should be done**

Add boundary tests covering:

- unauthenticated vs authenticated procedures;
- API-key parity decision;
- AppError → tRPC error shape;
- rate-limit keying and status;
- refresh-token cookie behavior;
- representative query/mutation input/output contracts.

**Proposed improvement**

Create `apps/api/test/trpc` integration tests or colocated `*.trpc.spec.ts` tests. Use `createCaller` for pure procedure behavior and HTTP `/trpc` tests for middleware/adapter behavior.

- **Severity:** Med
- **Effort:** M
- **Blast radius:** internal
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** L3-02, L3-05, L3-06
- **Cross-cut tag:** `T4-test-contracts`

### Layer 1 — tally

| Status    | Count |
| --------- | ----: |
| accepted  |     2 |
| rejected  |     0 |
| deferred  |     0 |
| withdrawn |     0 |

Cross-cutting tags introduced: `T4-test-contracts`.
Cross-cutting tags reused: `T1-policy-boundary`.

Dependency edges within Layer 1:

- L1-02 depends on the policy/context/error contract decisions so tests encode the final contract rather than today's accidental behavior.

---

## Layer 2 — Root tRPC router

Files: `apps/api/src/modules/trpc/trpc.router.ts`.

### Best-practice alignment

- The root router cleanly namespaces feature routers: `auth`, `cars`, `carModels`, `carManufacturers`, `accounts` (`trpc.router.ts:23-28`).
- The root router is the single source for `AppRouter`, which is the correct tRPC type contract pattern.
- The composition is explicit enough for a five-domain API; no dynamic registry is needed yet.

### L2-01 — Preserve explicit namespace composition

**Evidence**

`apps/api/src/modules/trpc/trpc.router.ts:23-28`

```ts
appRouter = this.trpc.router({
  auth: this.authTrpc.router,
  cars: this.carsTrpc.router,
  carModels: this.carModelsTrpc.router,
  carManufacturers: this.carManufacturersTrpc.router,
  accounts: this.accountsTrpc.router,
});
```

**Current state**

Each domain router is mounted under a stable namespace.

**Best-practice alignment**

This follows tRPC's recommended shape: split large routers into subrouters and merge/compose them into an app router that exports `AppRouter`.

**Desired state / how it should be done**

Keep this explicit root namespace map. Add procedure metadata/output contracts before considering fancier dynamic registration.

**Proposed improvement**

No structural change. Only add tests/snapshots around namespace names if public API stability becomes important.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** public-API
- **Class:** polish
- **Status:** accepted — preserve
- **Depends on:** none
- **Cross-cut tag:** `T3-public-contract`

### Layer 2 — tally

| Status    | Count |
| --------- | ----: |
| accepted  |     1 |
| rejected  |     0 |
| deferred  |     0 |
| withdrawn |     0 |

Cross-cutting tags introduced: none.
Cross-cutting tags reused: `T3-public-contract`.

Dependency edges within Layer 2: none.

---

## Layer 3 — Procedure, middleware, error, auth, rate-limit foundation

Files: `trpc.service.ts`, `trpc.middleware.ts`, `trpc-rate-limit.service.ts`, `trpc.consts.ts`, related REST guard/filter files for parity.

### Best-practice alignment

- `TrpcService` centralizes base procedures (`procedure`, `authenticatedProcedure`, `authenticatedShortProcedure`, `authenticatedMediumProcedure`), which is the right abstraction direction (`trpc.service.ts:39-86`).
- All public procedures receive CLS setup, error mapping, and default long rate limiting by default (`trpc.service.ts:39-47`).
- Sensitive mutations use stricter rate-limit bases (`auth.login`, `auth.refreshToken`, `cars.deleteById`), showing good endpoint risk awareness (`auth.trpc.ts:19-61`, `cars.trpc.ts:72-100`).
- `AppError` is translated toward tRPC codes instead of leaking raw Nest exceptions (`trpc.middleware.ts:42-56`, `trpc.consts.ts:4-16`).
- Refresh tokens are stored in httpOnly cookies while access tokens are sent by bearer header, which is a common web auth split (`auth.trpc.ts:21-32`, `Provider.tsx:58-77`).

### L3-01 — Two `initTRPC` instances split future global tRPC configuration

**Evidence**

`apps/api/src/modules/trpc/trpc.service.ts:36`, `apps/api/src/modules/trpc/trpc.middleware.ts:15`

```ts
trpc = initTRPC.context<TrpcContext>().create();
const t = initTRPC.context<TrpcContext>().create();
```

**Current state**

The procedure factory uses one tRPC instance while standalone middleware definitions use another compatible instance.

**Best-practice alignment**

The two instances currently share the same `TrpcContext` type, so the pattern works today.

**Desired state / how it should be done**

Create one canonical tRPC factory (`t`) with global config (`errorFormatter`, transformer if ever needed, meta) and derive router/procedure/middleware from that single object. If standalone middleware is required, export it from the same factory module.

**Proposed improvement**

Introduce `trpc.factory.ts` or move middleware construction behind `TrpcService` so the app cannot accidentally configure error formatting/transformers on only one tRPC instance.

- **Severity:** Med
- **Effort:** S
- **Blast radius:** internal
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** L0-01
- **Cross-cut tag:** `T1-policy-boundary`

### L3-02 — Principal is stored in CLS, not in typed tRPC context

**Evidence**

`apps/api/src/modules/trpc/trpc.service.ts:16-25`, `apps/api/src/modules/trpc/trpc.middleware.ts:26-30`, `apps/api/src/modules/trpc/trpc.middleware.ts:87-89`, `apps/api/src/modules/cars/cars.trpc.ts:104-113`

```ts
export type TrpcContext = { req; res };
Ctx.principal = authService.principalFromJwt(payload);
```

**Current state**

`tRPC` context only exposes `req` and `res`. Identity is hidden inside `Ctx`/CLS, and handlers/services read `Ctx.userIdRequired()` rather than `ctx.principal`.

**Best-practice alignment**

CLS gives the service layer a transport-agnostic way to access request identity. That is useful and should not be removed blindly.

**Desired state / how it should be done**

Create a typed context with identity and request metadata:

```ts
type TrpcContext = {
  req: Request;
  res: Response;
  requestId: UUID;
  correlationId: UUID;
  principal: Principal | null;
};

const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.principal) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { principal: ctx.principal } });
});
```

Then sync `Ctx.principal` from `ctx.principal` only as a service-layer bridge.

**Proposed improvement**

Move credential extraction into `createContext` or first middleware, put `principal` on `ctx`, and have auth middleware refine the typed context with `next({ ctx: { principal } })`.

- **Severity:** High
- **Effort:** M
- **Blast radius:** internal
- **Class:** redesign
- **Status:** accepted — recommended
- **Depends on:** L3-01
- **Cross-cut tag:** `T2-auth-context`

### L3-03 — Rate limiting tries to key by `ctx.principal`, but nothing sets it

**Evidence**

`apps/api/src/modules/trpc/trpc.middleware.ts:124-130`, `apps/api/src/modules/trpc/trpc.middleware.ts:26-30`, `apps/api/src/modules/trpc/trpc.middleware.ts:87-89`

```ts
if (ctx.principal?.id) {
  return `user:${ctx.principal.id}`;
}
Ctx.principal = authService.principalFromJwt(payload);
```

**Current state**

The default rate-limit key generator checks `ctx.principal?.id`, but the auth/CLS middlewares write identity to `Ctx.principal`, not `ctx.principal`. Authenticated tRPC requests therefore fall back to IP-based limiting.

**Best-practice alignment**

The desired policy — user-keyed limits for authenticated callers, IP-keyed limits for anonymous callers — is correct.

**Desired state / how it should be done**

Use one identity source. With L3-02 fixed, rate limiting should read `ctx.principal?.id`. If CLS remains the source temporarily, the key generator should read `Ctx.userId`, matching the REST `CustomThrottlerGuard` pattern.

Also include procedure path/type in the key or define explicit global-vs-per-procedure buckets.

**Proposed improvement**

After moving identity into `ctx`, change the key to include principal/IP plus tRPC path/type. Add tests that authenticated users get separate buckets and anonymous users share IP buckets.

- **Severity:** High
- **Effort:** S
- **Blast radius:** internal
- **Class:** redesign
- **Status:** accepted — recommended
- **Depends on:** L3-02
- **Cross-cut tag:** `T2-auth-context`

### L3-04 — tRPC auth supports bearer tokens but not REST's API-key path

**Evidence**

`apps/api/src/modules/trpc/trpc.middleware.ts:74-89`, `apps/api/src/common/guards/auth.guard.ts:34-52`, `apps/api/src/common/guards/auth.guard.ts:66-68`, `apps/api/src/main.ts:32-39`

```ts
const authorization = ctx.req.headers.authorization;
if (!authorization.startsWith("Bearer "))
  throw new AppError(Errors.UNAUTHORIZED);
```

**Current state**

REST `AuthGuard` supports bearer tokens and `x-api-key`. tRPC authenticated procedures only support bearer tokens, while CORS still allows `x-api-key`.

**Best-practice alignment**

Bearer-first auth is appropriate for browser tRPC clients using the refresh-token flow.

**Desired state / how it should be done**

Make an explicit product/security decision:

- If tRPC should support service clients, share one credential resolver with REST (`Authorization: Bearer` and `x-api-key`) and put the resulting `Principal` on `ctx`.
- If tRPC is browser-only, remove misleading `x-api-key` expectations from the tRPC path and document that API keys are REST-only.

**Proposed improvement**

Extract credential resolution into an injectable `AuthCredentialResolver` used by both REST guard and tRPC context/auth middleware. Add tests for bearer, api-key, malformed header, and missing credentials.

- **Severity:** Med
- **Effort:** M
- **Blast radius:** public-API
- **Class:** redesign
- **Status:** accepted — recommended
- **Depends on:** L3-02
- **Cross-cut tag:** `T2-auth-context`

### L3-05 — Structured app errors are not exposed through `errorFormatter`

**Evidence**

`apps/api/src/modules/trpc/trpc.middleware.ts:42-56`, `apps/api/src/modules/trpc/trpc.service.ts:36`, `apps/api/src/common/filters/http-error.filter.ts:28-77`, `apps/web/src/app/_trpc/Provider.tsx:42-46`

```ts
throw new TRPCError({
  code: trpcCode,
  message: appErrorResponse.message,
  cause: {
    errorCode: appErrorResponse.errorCode,
    errors: appErrorResponse.errors,
  },
});
```

**Current state**

`tRPC` middleware converts `AppError` to `TRPCError`, but the tRPC factory does not define `errorFormatter`. The REST filter returns stable `ErrorDto`, while the tRPC client mostly reads `error.data?.code` and `error.message`.

**Best-practice alignment**

Mapping domain `AppError` to tRPC's error code vocabulary is the right direction.

**Desired state / how it should be done**

Use `initTRPC.create({ errorFormatter })` to expose a stable client-visible shape, for example:

```ts
errorFormatter({ shape, error }) {
  const cause = error.cause instanceof AppError ? error.cause.getResponse() : undefined;
  return {
    ...shape,
    data: {
      ...shape.data,
      errorCode: cause?.errorCode,
      errors: cause?.errors,
    },
  };
}
```

Then clients can reliably branch on domain error codes instead of parsing message text.

**Proposed improvement**

Move AppError shape mapping into the canonical tRPC factory's `errorFormatter`; keep middleware only for logging/side effects or remove it if formatter plus thrown `AppError` is sufficient.

- **Severity:** Med
- **Effort:** M
- **Blast radius:** public-API
- **Class:** redesign
- **Status:** accepted — recommended
- **Depends on:** L3-01
- **Cross-cut tag:** `T5-error-contract`

### L3-06 — Rate limiter is non-atomic and does not define per-procedure buckets

**Evidence**

`apps/api/src/modules/trpc/trpc-rate-limit.service.ts:34-63`, `apps/api/src/modules/trpc/trpc.middleware.ts:144-181`

```ts
let record = await this.cacheManager.get<RateLimitRecord>(cacheKey);
record.count++;
await this.cacheManager.set(cacheKey, record, ttlMs);
```

**Current state**

Rate limiting uses a cache get/increment/set sequence. The default key is identity/IP only, not procedure path, and the implementation fails open with `console.error` on cache errors.

**Best-practice alignment**

Having tRPC-specific rate tiers is good because raw tRPC middleware does not use Nest's `ThrottlerGuard`.

**Desired state / how it should be done**

For production-grade limits:

- use an atomic increment primitive in Redis or a cache backend that supports atomic counters;
- define whether limits are global per identity, per procedure, or per tier;
- include path/type in the key when a per-procedure policy is intended;
- emit structured logs/metrics on fail-open;
- expose retry metadata consistently to clients.

**Proposed improvement**

Replace get/set counters with an atomic backend abstraction, include tRPC path/type in `createRateLimitMiddleware`, and document fail-open vs fail-closed behavior per environment.

- **Severity:** Med
- **Effort:** M
- **Blast radius:** internal
- **Class:** redesign
- **Status:** accepted — recommended
- **Depends on:** L3-03
- **Cross-cut tag:** `T6-rate-limit-contract`

### L3-07 — Exported preconfigured rate-limit middlewares are unsafe without a service

**Evidence**

`apps/api/src/modules/trpc/trpc.middleware.ts:144-158`, `apps/api/src/modules/trpc/trpc.middleware.ts:186-198`

```ts
if (!rateLimitService) {
  throw new Error("RateLimitService not set");
}
export const shortRateLimit = createRateLimitMiddleware({
  ...RateLimitTiers.SHORT,
});
```

**Current state**

`shortRateLimit`, `mediumRateLimit`, and `longRateLimit` are exported without `rateLimitService`, so using them would throw at runtime. Current `TrpcService` avoids this by creating service-backed middleware, but the unsafe exports remain.

**Best-practice alignment**

The tier constants are useful.

**Desired state / how it should be done**

Export only pure tier config constants or service-bound factory functions. Do not export middleware instances that are known to throw when used.

**Proposed improvement**

Delete `shortRateLimit`, `mediumRateLimit`, and `longRateLimit` exports, or convert them into functions that require `TrpcRateLimitService`.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** internal
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** none
- **Cross-cut tag:** `T6-rate-limit-contract`

### L3-08 — Request context is initialized twice across Nest and tRPC

**Evidence**

`apps/api/src/common/middlewares/context.middleware.ts:9-12`, `apps/api/src/modules/trpc/trpc.middleware.ts:18-34`, `apps/api/src/app.module.ts:102-105`

```ts
setupContext(req);
return cls.runWith({}, async () => {
  setupContext(ctx.req);
  ...
});
```

**Current state**

Nest has global CLS/context middleware, and tRPC also starts its own CLS scope and calls `setupContext` per procedure.

**Best-practice alignment**

The tRPC-specific CLS setup protects raw tRPC requests even if Nest controller middleware does not apply as expected.

**Desired state / how it should be done**

Declare ownership clearly. If tRPC owns its own pipeline, initialize context once in tRPC context/middleware and let Nest middleware handle REST. If both execute for `/trpc`, ensure the second initialization preserves incoming request/correlation IDs and does not shadow values unexpectedly.

**Proposed improvement**

After L0-01, add a small integration test asserting `x-request-id`/`x-correlation-id` behavior on `/trpc`; then remove duplicate setup if proven unnecessary or keep it with an explicit comment explaining why raw tRPC needs it.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** internal
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** L0-01
- **Cross-cut tag:** `T1-policy-boundary`

### Layer 3 — tally

| Status    | Count |
| --------- | ----: |
| accepted  |     8 |
| rejected  |     0 |
| deferred  |     0 |
| withdrawn |     0 |

Cross-cutting tags introduced: `T2-auth-context`, `T5-error-contract`, `T6-rate-limit-contract`.
Cross-cutting tags reused: `T1-policy-boundary`.

Dependency edges within Layer 3:

- L3-02 depends on L3-01.
- L3-03 depends on L3-02.
- L3-04 depends on L3-02.
- L3-05 depends on L3-01.
- L3-06 depends on L3-03.
- L3-08 depends on L0-01.

---

## Layer 4 — Feature query/mutation routers

Files: `auth.trpc.ts`, `accounts.trpc.ts`, `cars.trpc.ts`, `car-models.trpc.ts`, `car-manufacturers.trpc.ts`.

### Exposed procedures

| Namespace          | Queries                                                           | Mutations                                          |
| ------------------ | ----------------------------------------------------------------- | -------------------------------------------------- |
| `auth`             | —                                                                 | `login`, `logout`, `refreshToken`                  |
| `accounts`         | `getMe`, `hasApiKey`, `getByUsername`                             | `updateProfile`, `generateApiKey`                  |
| `cars`             | `list`, `getById`, `getFavorites`, `getMyCars`, `getCarsByUserId` | `create`, `update`, `deleteById`, `toggleFavorite` |
| `carModels`        | `list`                                                            | —                                                  |
| `carManufacturers` | `list`                                                            | —                                                  |
| **Total**          | **10**                                                            | **9**                                              |

### Best-practice alignment

- Feature routers are thin: they validate input, call a service, and map entities through adapters. That is the right tRPC handler shape.
- Public vs authenticated procedures are mostly explicit in code comments and procedure base selection.
- Zod input schemas are used throughout, including shared UUID/sort/pagination schemas and DTO schemas.
- Car mutation authorization lives in `CarsService`, so REST and tRPC can share ownership checks.

### L4-01 — tRPC outputs are not runtime-validated even though REST responses are serialized

**Evidence**

`apps/api/src/app.module.ts:76-81`, `apps/api/src/modules/cars/cars.trpc.ts:45-68`, `apps/api/src/modules/accounts/accounts.trpc.ts:24-28`

```ts
useClass: ZodSerializerInterceptor // Runtime response validation/serialization
list: this.trpc.procedure.input(...).query(async ({ input }): Promise<PaginationDto<CarDto>> => ...)
```

**Current state**

REST has `ZodSerializerInterceptor`, but tRPC handlers rely on TypeScript return annotations and adapter discipline. There are no `.output(...)` validators on tRPC procedures.

**Best-practice alignment**

TypeScript inference already gives strong compile-time client types, and adapters centralize DTO mapping.

**Desired state / how it should be done**

For externally consumed API contracts, add `.output(schema)` to important tRPC procedures or create a consistent response validation strategy. This is especially important because raw tRPC bypasses Nest's response serializer.

**Proposed improvement**

Add Zod output schemas for auth/account/car DTOs and pagination wrappers. Start with public procedures and auth mutations, then apply to all routers.

- **Severity:** Med
- **Effort:** M
- **Blast radius:** public-API
- **Class:** redesign
- **Status:** accepted — recommended
- **Depends on:** L0-01, L3-05
- **Cross-cut tag:** `T3-public-contract`

### L4-02 — `accounts.getMe` uses a non-null assertion after lookup

**Evidence**

`apps/api/src/modules/accounts/accounts.trpc.ts:24-28`

```ts
const user = await this.usersService.findById(userId);
return this.accountsAdapter.getDto(user!);
```

**Current state**

An authenticated user ID is assumed to map to an existing user. If it does not, the adapter receives `undefined` and the error shape becomes accidental.

**Best-practice alignment**

The procedure correctly requires authentication before reading the current account.

**Desired state / how it should be done**

Treat missing current user as an explicit domain error (`USER_NOT_FOUND`, `UNAUTHORIZED`, or a session-invalid error), then let the tRPC error contract format it.

**Proposed improvement**

Replace `user!` with an explicit check and `AppError`, plus a tRPC test for stale/deleted-user token behavior.

- **Severity:** Med
- **Effort:** S
- **Blast radius:** public-API
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** L3-05
- **Cross-cut tag:** `T5-error-contract`

### L4-03 — `cars.toggleFavorite` returns the previous favorite state as `favorited`

**Evidence**

`apps/api/src/modules/cars/cars.trpc.ts:104-115`, `apps/api/src/modules/cars/cars.service.ts:219-238`

```ts
const favorited = await this.carsService.toggleFavoriteForUser(input.id, userId);
return { favorited };
...
return isFavorited;
```

**Current state**

`CarsService.toggleFavoriteForUser` returns `isFavorited`, which is the state before the toggle. The tRPC mutation exposes that value as `{ favorited }`, which reads like the new state.

**Best-practice alignment**

The procedure uses an authenticated base and delegates ownership of favorite persistence to the service.

**Desired state / how it should be done**

Mutation responses should describe the post-mutation state, or their field names should make previous state explicit.

**Proposed improvement**

Return `!isFavorited` from the service, or rename the response to `{ wasFavorited }` and add `{ favorited: !wasFavorited }` if the UI needs the new state. Add an output schema/test.

- **Severity:** Med
- **Effort:** S
- **Blast radius:** public-API
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** L4-01
- **Cross-cut tag:** `T3-public-contract`

### L4-04 — Public `getCarsByUserId` exposes raw user IDs as lookup keys

**Evidence**

`apps/api/src/modules/cars/cars.trpc.ts:155-173`

```ts
// Public route - get any user's cars by user ID
getCarsByUserId: this.trpc.procedure.input(z.object({ userId: uuidSchema, ... }))
```

**Current state**

Anyone can query cars by a raw user UUID.

**Best-practice alignment**

The comment makes the public intent explicit, and service-layer reads are simple.

**Desired state / how it should be done**

Confirm the product policy. If public profile inventory is intended, prefer a public identifier (`username`, profile slug) and document exactly what fields are safe. If raw UUID lookup is not required, make the procedure authenticated or replace it with a public profile route.

**Proposed improvement**

Add an explicit public-profile policy and tests. Consider replacing `getCarsByUserId` with `getCarsByUsername` or `accounts.getByUsername → cars.listByAccount` flow.

- **Severity:** Low
- **Effort:** M
- **Blast radius:** public-API
- **Class:** redesign
- **Status:** accepted — recommended
- **Depends on:** L4-01
- **Cross-cut tag:** `T3-public-contract`

### L4-05 — Pagination/default schemas diverge across routers

**Evidence**

`apps/api/src/modules/cars/cars.trpc.ts:33-42`, `apps/api/src/modules/car-models/car-models.trpc.ts:24-46`, `apps/api/src/modules/car-manufacturers/car-manufacturers.trpc.ts:23-43`

```ts
limit: z.number().int().min(0).max(100).optional().default(10);
limit: input?.limit ?? 100;
```

**Current state**

Cars default to page size 10 in several procedures, while car models/manufacturers default to 100. Some routers use `skipLimitSchema`, others inline equivalent schemas.

**Best-practice alignment**

Every list procedure has bounded pagination input.

**Desired state / how it should be done**

Use shared pagination input schemas and named defaults per use case. Divergence should be intentional and documented, not incidental.

**Proposed improvement**

Introduce shared `listInputSchema` helpers or named constants (`DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`) and reuse them across tRPC routers.

- **Severity:** Low
- **Effort:** S
- **Blast radius:** public-API
- **Class:** polish
- **Status:** accepted — recommended
- **Depends on:** L4-01
- **Cross-cut tag:** `T3-public-contract`

### Layer 4 — tally

| Status    | Count |
| --------- | ----: |
| accepted  |     5 |
| rejected  |     0 |
| deferred  |     0 |
| withdrawn |     0 |

Cross-cutting tags introduced: none.
Cross-cutting tags reused: `T3-public-contract`, `T5-error-contract`.

Dependency edges within Layer 4:

- L4-01 depends on L0-01 and L3-05.
- L4-02 depends on L3-05.
- L4-03, L4-04, and L4-05 depend on L4-01.

---

## Cross-cutting themes

### T1 — Policy boundary between NestJS and raw tRPC (active)

**Findings:** L0-01, L1-01, L3-01, L3-08.

The core architectural decision is whether `/trpc` is a raw Express island inside Nest or a Nest-native tRPC surface. The current implementation mostly behaves as a raw tRPC island, which is valid, but comments/module structure still imply Nest global policy may apply. Closing this theme means making the boundary explicit, centralizing the tRPC factory, and documenting/testing what owns request context.

### T2 — Auth identity and role context (active)

**Findings:** L3-02, L3-03, L3-04.

Auth identity is currently split between tRPC `ctx`, CLS `Ctx`, REST `AuthGuard`, and rate-limit keying. The highest-leverage fix is to put `Principal | null` into typed tRPC context and use middleware to refine it for protected procedures. That single move fixes rate-limit keying and creates a clean place to support or explicitly reject API-key auth for tRPC.

### T3 — Public tRPC contract stability (active)

**Findings:** L0-02, L2-01, L4-01, L4-03, L4-04, L4-05.

The root router and web type imports make procedure names, inputs, outputs, and response semantics a public API. This theme keeps the good namespace composition while adding output validation, stable type exports, and clearer public procedure semantics.

### T4 — tRPC test contracts (active)

**Findings:** L1-02.

No tRPC tests were found. Once the target context/error/rate-limit shape is chosen, tests should lock the behavior at the tRPC boundary so future changes do not accidentally rely on Nest REST filters/guards.

### T5 — Error contract parity (active)

**Findings:** L3-05, L4-02.

REST has a stable `ErrorDto`; tRPC currently maps `AppError` toward tRPC codes but does not expose the domain error payload through `errorFormatter`. Closing this theme gives clients structured `errorCode`/`errors` fields and avoids accidental crashes from non-null assertions.

### T6 — Rate-limit contract (active)

**Findings:** L3-03, L3-06, L3-07.

Rate limiting exists and is thoughtfully tiered, but its identity key is currently wrong for authenticated users, its counter is non-atomic, and unused exports are unsafe. Closing this theme produces a deterministic, tested rate-limit contract.

---

## Consolidated polish plan

5 phases, ordered top-to-bottom. Each phase is blueprint-consumable; sizing is by agent-relevant signals.

### Phase 1 — Make the tRPC/NestJS policy boundary explicit

**Goal:** Decide and document that `/trpc` is a raw tRPC policy pipeline inside Nest, then remove misleading Nest-pipeline assumptions.

**Findings (4):** L0-01, L1-01, L3-01, L3-08.

**Files touched (5):** `apps/api/src/main.ts`, `apps/api/src/modules/trpc/trpc.modules.ts`, `apps/api/src/modules/trpc/trpc.router.ts`, `apps/api/src/modules/trpc/trpc.service.ts`, `apps/api/src/modules/trpc/trpc.middleware.ts`.

**Blast-radius mix:** internal: 4; public-API: 0; on-disk: 0; cross-module: 0.

**Class mix:** polish: 3; redesign: 1.

**Coordination:** none.

**Risk callouts:** Keep runtime behavior unchanged while moving factory ownership; tests should prove `/trpc` still mounts and request IDs still flow.

### Phase 2 — Move auth identity into typed tRPC context

**Goal:** Make `principal` a typed tRPC context property and use protected procedures to refine it.

**Findings (3):** L3-02, L3-03, L3-04.

**Files touched (6):** `trpc.service.ts`, `trpc.middleware.ts`, `trpc-rate-limit.service.ts`, `auth.guard.ts`, optional new shared auth resolver, tRPC tests.

**Blast-radius mix:** internal: 2; public-API: 1; on-disk: 0; cross-module: 0.

**Class mix:** polish: 0; redesign: 3.

**Coordination:** none unless API-key support for tRPC changes documented client behavior.

**Risk callouts:** This phase changes security plumbing; land with focused auth/rate-limit tests before touching feature routers.

### Phase 3 — Stabilize tRPC error and rate-limit contracts

**Goal:** Add client-visible structured error formatting and production-safe rate-limit semantics.

**Findings (4):** L3-05, L3-06, L3-07, L1-02.

**Files touched (5):** `trpc.service.ts`, `trpc.middleware.ts`, `trpc-rate-limit.service.ts`, `trpc.consts.ts`, `apps/api/test/**`.

**Blast-radius mix:** internal: 3; public-API: 1; on-disk: 0; cross-module: 0.

**Class mix:** polish: 2; redesign: 2.

**Coordination:** web client may need to switch from message-only toast handling to structured error data.

**Risk callouts:** Error shape is public API. Version or coordinate with web changes if client-visible `error.data` fields change.

### Phase 4 — Harden feature procedure contracts

**Goal:** Add output validation and fix procedure-level contract ambiguities.

**Findings (5):** L4-01, L4-02, L4-03, L4-04, L4-05.

**Files touched (8):** `auth.trpc.ts`, `accounts.trpc.ts`, `cars.trpc.ts`, `car-models.trpc.ts`, `car-manufacturers.trpc.ts`, DTO/schema files, `cars.service.ts`, tRPC tests.

**Blast-radius mix:** internal: 0; public-API: 5; on-disk: 0; cross-module: 0.

**Class mix:** polish: 3; redesign: 2.

**Coordination:** web client may need updates if `toggleFavorite` response semantics or public user-car lookup changes.

**Risk callouts:** Public procedure output changes should land with web updates and contract tests.

### Phase 5 — Publish router types through a stable boundary

**Goal:** Stop web from deep-importing API implementation internals for `AppRouter`.

**Findings (1):** L0-02.

**Files touched (4):** new/updated API contract barrel/package, `apps/web/src/app/_trpc/client.ts`, `apps/web/src/app/_trpc/Provider.tsx`, `apps/web/src/app/_trpc/types.ts`.

**Blast-radius mix:** internal: 0; public-API: 0; on-disk: 0; cross-module: 1.

**Class mix:** polish: 1; redesign: 0.

**Coordination:** sibling package/import-path update in web.

**Risk callouts:** Keep the export type-only to avoid bundling API runtime code into the web client.

### Dependency graph (phase-level)

```text
Phase 1 (Policy boundary)
   ↓
Phase 2 (Typed auth context)
   ↓
Phase 3 (Error + rate-limit contracts)
   ↓
Phase 4 (Feature procedure contracts)
   ↓
Phase 5 (Stable router type boundary)
```

### Phase scope summary

| Phase                            | Findings |          Files | Blast-radius mix           | Coordination              |
| -------------------------------- | -------: | -------------: | -------------------------- | ------------------------- |
| 1 — Policy boundary              |        4 |              5 | internal: 4                | none                      |
| 2 — Typed auth context           |        3 |              6 | internal: 2; public-API: 1 | auth behavior decision    |
| 3 — Error + rate-limit contracts |        4 |              5 | internal: 3; public-API: 1 | web error handling        |
| 4 — Feature procedure contracts  |        5 |              8 | public-API: 5              | web client updates likely |
| 5 — Stable router type boundary  |        1 |              4 | cross-module: 1            | web import update         |
| **Total**                        |   **17** | **~18 unique** | —                          | —                         |

### Risk callouts (cross-phase)

1. Phase 2 and Phase 3 touch security/error behavior; ship with focused tRPC tests before public feature-router changes.
2. Phase 4 changes public procedure semantics; coordinate with web UI if output schemas or `toggleFavorite` response semantics change.
3. Phase 5 should be type-only. Accidentally exporting runtime API code into the web bundle is the main implementation risk.

### Final tally

| Layer                              | Findings | Accepted | Withdrawn |
| ---------------------------------- | -------: | -------: | --------: |
| L0 — Public mount + type contract  |        2 |        2 |         0 |
| L1 — NestJS module composition     |        2 |        2 |         0 |
| L2 — Root tRPC router              |        1 |        1 |         0 |
| L3 — Procedure/security foundation |        8 |        8 |         0 |
| L4 — Feature routers               |        5 |        5 |         0 |
| **Total**                          |   **18** |   **18** |     **0** |

**Cross-cuts closed by completion of this plan:** T1, T2, T3, T4, T5, T6.

**Cross-cuts remaining active (by design, post-completion):** none.

Plan ready for the implementation phase.

---

## External references

- [tRPC Express Adapter](https://trpc.io/docs/server/adapters/express)
- [tRPC Authorization](https://trpc.io/docs/server/authorization)
- [tRPC Middlewares](https://trpc.io/docs/server/middlewares)
- [tRPC Error Formatting](https://trpc.io/docs/server/error-formatting)
- [NestJS Request lifecycle](https://docs.nestjs.com/faq/request-lifecycle)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS-tRPC Context](https://www.nestjs-trpc.io/docs/context)
- [NestJS-tRPC Middlewares](https://www.nestjs-trpc.io/docs/middlewares)
