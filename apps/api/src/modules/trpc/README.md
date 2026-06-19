# tRPC Architecture Pattern

This API exposes TypeScript-first application behavior through tRPC and
language-neutral external behavior through REST/OpenAPI. tRPC procedures should
stay thin: validate input/output, apply the shared auth/context/error/rate-limit
policy, call Nest services for business logic, and return DTOs. Tests mirror
that shape: caller tests prove procedure behavior through the real tRPC router,
while HTTP e2e tests prove the `/trpc` wire, cookies, headers, and middleware
boundary.

We intentionally use explicit/plain tRPC router factories instead of a
Nest-specific decorator/code-generation adapter. That keeps the tRPC router
object as the source of truth, so TypeScript can infer resolver inputs from
`.input(...)` and editor navigation can jump between frontend
`trpc.namespace.procedure` usage and backend procedure source.

## DX decision guide

| Goal                                                           | Use                               | Rationale                                                                                                                                                                                                                         |
| -------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Best first-party TypeScript-to-TypeScript developer experience | Plain tRPC + `@repo/api-contract` | The frontend imports the real `AppRouter` type, so inputs/outputs infer from the backend router and Cmd/Ctrl-click can navigate to the actual procedure implementation. No generated client or duplicated schema layer is needed. |
| Best generated client/documentation experience                 | REST/OpenAPI + Swagger            | OpenAPI is the better contract for external consumers, non-TypeScript clients, SDK generation, and public HTTP documentation.                                                                                                     |

Do not optimize one surface for both jobs. tRPC is the ergonomic internal
TypeScript surface. Swagger/OpenAPI is the durable generated-client and
language-neutral integration surface.

## Surface and auth boundary

- Use tRPC for first-party TypeScript/browser consumers.
- Use JWT bearer auth for authenticated tRPC procedures.
- Do not accept API keys on tRPC procedures unless a future server-to-server
  TypeScript surface is explicitly designed.
- Use REST/OpenAPI controllers for language-neutral or external programmatic
  consumers.
- Use `x-api-key` auth for protected REST controllers.

## Where behavior belongs

- **Business logic:** Nest services such as `CarsService`, `AuthService`, and
  `UsersService`.
- **Transport shape:** explicit `createFeatureRouter({ trpc, ...deps })`
  factories in `*.trpc.ts` files.
- **Input contracts:** Zod schemas near DTOs or module schemas, passed directly
  to `.input(...)`.
- **Output contracts:** `.output(...)` for public, auth-sensitive, or
  entity-derived responses.
- **Context/auth/errors/rate limits:** shared base procedures in
  `trpc.service.ts` plus JWT context creation in `trpc.context.ts`.
- **Runtime AppRouter type:** the real `createAppRouter(...)` return type from
  `trpc.router.ts`, exported to TypeScript consumers by `@repo/api-contract`.

## Procedure middleware model

All shared tRPC middleware is composed in `trpc.service.ts`. Feature routers
should use the exported base procedures instead of recreating auth, context,
error handling, or rate limiting locally.

### Base procedure chain

`defaultRateLimitedProcedure` is the base chain for normal tRPC traffic:

1. `requestContextMiddleware`
   - initializes request/CLS context through `setupContext(ctx.req)`;
   - copies the tRPC `principal` into `Ctx.principal` when present;
   - writes `x-request-id` and `x-correlation-id` response headers.
2. `errorMiddleware`
   - maps domain `AppError`s into deterministic `TRPCError`s;
   - preserves tRPC error codes for the frontend client;
   - keeps feature routers from handling transport error formatting.
3. `longRateLimitMiddleware`
   - applies the default/normal rate limit to every public and protected
     procedure;
   - keys by authenticated user when available, otherwise by request IP;
   - includes operation type and procedure path in the key.

The exported procedures build on that chain:

| Procedure                                              | Middleware included                               | Use for                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `publicProcedure`                                      | context + error mapping + default long rate limit | Public reads or public mutations that are safe with the normal limiter.                 |
| `protectedProcedure`                                   | `publicProcedure` + `requirePrincipalMiddleware`  | JWT-authenticated user procedures.                                                      |
| `adminProcedure`                                       | `protectedProcedure` + `requireAdminMiddleware`   | Admin-only procedures.                                                                  |
| `publicShortProcedure` / `publicMediumProcedure`       | `publicProcedure` + extra short/medium limiter    | Public procedures that should stop repeated attempts quickly, such as login or refresh. |
| `protectedShortProcedure` / `protectedMediumProcedure` | `protectedProcedure` + extra short/medium limiter | Authenticated mutations that need tighter abuse protection.                             |

Short and medium limiters are additive. They do not replace the default long
limiter. This means sensitive procedures get both the normal sustained-traffic
limit and a tighter burst limit.

### How to use it in feature routers

Prefer choosing the correct base procedure at the call site:

```ts
return trpc.router({
  list: trpc.publicProcedure.query(() => carsService.findAll()),

  create: trpc.protectedProcedure
    .input(createCarSchema)
    .output(carSchema)
    .mutation(({ input, ctx }) => {
      return carsService.create(input, ctx.principal.userId);
    }),

  login: trpc.publicShortProcedure
    .input(loginSchema)
    .output(jwtSchema)
    .mutation(({ input }) => authService.login(input)),
});
```

Do not add ad-hoc auth checks, `try/catch` error mapping, or custom rate-limit
logic inside feature routers unless the procedure has a truly unique rule.
Routers should validate, call services, and return DTOs.

### How to extend it

When adding new cross-cutting behavior:

1. Put shared middleware in `TrpcService`, not inside individual routers.
2. Decide whether it is universal or scoped:
   - universal behavior belongs in `defaultRateLimitedProcedure`;
   - scoped behavior should become a named composed procedure such as
     `protectedAuditProcedure` or `adminShortProcedure`.
3. Keep middleware order intentional:
   - request context first, so downstream middleware and services can use `Ctx`;
   - error mapping before middleware that may throw `AppError`;
   - default rate limiting before procedure execution;
   - auth before role-specific checks.
4. Add caller tests for middleware behavior and HTTP e2e tests only when the
   wire shape matters, such as headers, cookies, batching, or final error JSON.

If a new procedure category appears repeatedly, create a named base procedure
instead of copying `.use(...)` chains throughout feature routers.

## Copy-this pattern for a new namespace

1. Add or reuse DTO/Zod schemas for request and response shapes.
2. Create `feature.trpc.ts` with a `createFeatureRouter({ trpc, ...deps })`
   factory.
3. Depend on Nest services/adapters through the factory deps; do not put
   business rules in the procedure.
4. Use `trpc.protectedProcedure` for JWT-protected procedures or
   `trpc.adminProcedure` for admin-only procedures.
5. Use `trpc.publicShortProcedure`, `trpc.publicMediumProcedure`,
   `trpc.protectedShortProcedure`, or `trpc.protectedMediumProcedure` when a
   procedure needs an additional rate-limit tier on top of the default long
   bucket.
6. Compose the namespace in `createAppRouter(...)` in `trpc.router.ts`.
7. Add caller tests for procedure behavior and HTTP e2e tests only for
   wire-level headers, cookies, batching, or final error shape.

## Sensitive auth rate limiting example

All base procedures include the normal/default long rate limiter. Sensitive
auth procedures should add a tighter limiter on top rather than replacing the
normal one:

```ts
return trpc.router({
  // Default LONG + extra SHORT burst limiter: hammering login should stop fast.
  login: trpc.publicShortProcedure
    .input(loginSchema)
    .output(jwtSchema)
    .mutation(async ({ input, ctx }) => {
      // ...
    }),

  // Default LONG + extra MEDIUM limiter: refresh abuse should also stop quickly.
  refreshToken: trpc.publicMediumProcedure
    .output(jwtSchema)
    .mutation(async ({ ctx }) => {
      // ...
    }),
});
```

Use this pattern for any procedure where fast repeated attempts are dangerous:
password/login flows, token refresh/rotation, API key creation, and other
state-changing security-sensitive procedures.

## Test layers

- **Unit tests:** isolated guards/services/helpers, e.g. API-key-only REST guard
  behavior and service state semantics.
- **tRPC caller/integration tests:** router + middleware behavior without HTTP
  serialization noise, e.g. JWT-only tRPC auth, AppError mapping, output
  validation, and rate-limit keys.
- **HTTP `/trpc` e2e tests:** official tRPC client or Supertest against a Nest
  test app for mount path, headers, cookies, refresh-token flow, batching, and
  final wire errors.
