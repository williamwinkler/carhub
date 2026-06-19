# @repo/api-contract

Type-only tRPC contracts for TypeScript consumers.

This package exposes the tRPC `AppRouter` and inferred input/output helper
types from the API app through a stable workspace package boundary. It
intentionally contains no runtime client implementation.

Use this package when a TypeScript consumer needs the first-party tRPC
contract. Authenticated tRPC calls use JWT bearer auth. Non-TypeScript or
external programmatic consumers should use REST/OpenAPI with API keys instead.

Use type-only imports:

```ts
import type {
  AppRouter,
  RouterInputs,
  RouterOutputs,
} from "@repo/api-contract";
```

Do not add runtime exports here. If a reusable runtime tRPC client is needed
later, create a separate package such as `@repo/api-trpc-client`. If a
generated Swagger/OpenAPI client is needed later, create a separate REST client
package instead of mixing it into this type-only tRPC contract.
