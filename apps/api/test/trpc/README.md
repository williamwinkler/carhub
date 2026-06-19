# tRPC Test Pattern

Use the smallest test layer that proves the contract:

- Unit specs (`*.unit-spec.ts`) for isolated service/guard behavior.
- tRPC caller specs (`*.trpc.spec.ts`) for procedure behavior through the real
  `nestjs-trpc` router and middlewares.
- HTTP e2e specs (`*.e2e-spec.ts`) for `/trpc` wire behavior such as headers,
  cookies, batching, and final client-visible error shape.

The shared helper in `test/helpers/trpc-testing.ts` builds a DB-free Nest test
app with real tRPC router providers and mocked Nest services. Copy that pattern
when adding a namespace-specific caller test: inject the real router class and
middlewares, mock the service boundary, and assert DTO/output/error contracts
at the tRPC boundary.

When a test needs to prove browser/client behavior, start the Nest test app on
an ephemeral port and call it with `@trpc/client` rather than hand-writing the
HTTP body.
