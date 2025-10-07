// src/modules/trpc/trpc.service.ts
import { Injectable } from "@nestjs/common";
import { initTRPC } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { AuthService } from "../auth/auth.service";
import { TrpcRateLimitService } from "./trpc-rate-limit.service";
import {
  clsMiddleware,
  createAuthMiddleware,
  createRateLimitMiddleware,
  errorMiddleware,
  RateLimitTiers,
} from "./trpc.middleware";

// tRPC context type
export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
};

export function createContext({
  req,
  res,
}: CreateExpressContextOptions): TrpcContext {
  return { req, res };
}

@Injectable()
export class TrpcService {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimitService: TrpcRateLimitService,
  ) {}

  // Create tRPC instance with context type
  trpc = initTRPC.context<TrpcContext>().create();

  // Base procedure with CLS + error handling + default rate limiting
  procedure = this.trpc.procedure
    .use(clsMiddleware(this.authService))
    .use(errorMiddleware)
    .use(
      createRateLimitMiddleware({
        ...RateLimitTiers.LONG,
        message: "Rate limit exceeded",
        rateLimitService: this.rateLimitService,
      }),
    );

  // Authenticated procedure (inherits default rate limiting)
  authenticatedProcedure = this.procedure.use(
    createAuthMiddleware(this.authService),
  );

  adminProcedure = this.procedure.use(
    createAuthMiddleware(this.authService, "admin"),
  );

  // Helper method to create custom rate limit configurations
  createCustomRateLimit = (
    tier: keyof typeof RateLimitTiers,
    message?: string,
  ) =>
    createRateLimitMiddleware({
      ...RateLimitTiers[tier],
      message: message ?? "Rate limit exceeded",
      rateLimitService: this.rateLimitService,
    });

  // Optional procedures for overriding default rate limits
  shortRateLimitProcedure = this.trpc.procedure
    .use(clsMiddleware(this.authService))
    .use(errorMiddleware)
    .use(this.createCustomRateLimit("SHORT", "Too many requests per second"));

  mediumRateLimitProcedure = this.trpc.procedure
    .use(clsMiddleware(this.authService))
    .use(errorMiddleware)
    .use(this.createCustomRateLimit("MEDIUM", "Rate limit exceeded"));

  // Authenticated versions with custom rate limits
  authenticatedShortProcedure = this.shortRateLimitProcedure.use(
    createAuthMiddleware(this.authService),
  );
  authenticatedMediumProcedure = this.mediumRateLimitProcedure.use(
    createAuthMiddleware(this.authService),
  );

  router = this.trpc.router;
  middleware = this.trpc.middleware;
  mergeRouters = this.trpc.mergeRouters;
}
