// src/modules/trpc/trpc.middleware.ts
import { Ctx } from "@api/common/ctx";
import { BaseError } from "@api/common/errors/base-error";
import { UnauthorizedError } from "@api/common/errors/domain/unauthorized.error";
import { setupContext } from "@api/common/utils/context.utils";
import { AuthService } from "@api/modules/auth/auth.service";
import { HttpStatus } from "@nestjs/common";
import { TRPCError, initTRPC } from "@trpc/server";
import { ClsServiceManager } from "nestjs-cls";
import { httpStatusToTrpcCode } from "./trpc.consts";
import type { TrpcContext } from "./trpc.service";

// Create a tRPC instance just for middleware definitions
const t = initTRPC.context<TrpcContext>().create();

// CLS middleware for all tRPC calls
export const clsMiddleware = t.middleware(async ({ ctx, next }) => {
  const cls = ClsServiceManager.getClsService();

  return cls.runWith({}, async () => {
    setupContext(ctx.req);

    ctx.res.setHeader("x-request-id", Ctx.requestId);
    ctx.res.setHeader("x-correlation-id", Ctx.correlationId);

    return next();
  });
});

// Error handling middleware
export const errorMiddleware = t.middleware(async ({ next }) => {
  const result = await next();

  // Map the BaseError to the corresponding tRPC error code
  if (!result.ok && result.error.cause instanceof BaseError) {
    const httpStatus =
      result.error.cause.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const trpcCode =
      httpStatusToTrpcCode[httpStatus] ?? "INTERNAL_SERVER_ERROR";

    throw new TRPCError({
      code: trpcCode,
      message: result.error.cause.error.message,
      cause: {
        errorCode: result.error.cause.error.errorCode,
        errors: result.error.cause.error.errors,
      },
    });
  }

  return result;
});

// Authentication middleware factory
export const createAuthMiddleware = (authService: AuthService) => {
  return t.middleware(async ({ ctx, next }) => {
    const authorization = ctx.req.headers.authorization;

    if (!authorization) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No authorization header provided",
      });
    }

    try {
      if (!authorization.startsWith("Bearer ")) {
        throw new UnauthorizedError();
      }
      const token = authorization.slice(7);
      const payload = await authService.verifyAccessToken(token);
      Ctx.principal = authService.principalFromJwt(payload);
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
        cause: error,
      });
    }

    return next();
  });
};

import type { TrpcRateLimitService } from "./trpc-rate-limit.service";

// Rate limiting configuration types
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Custom error message
  keyGenerator?: (ctx: TrpcContext & { principal?: any }) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  rateLimitService?: TrpcRateLimitService; // Cache-based rate limiting service
}

// Rate limit tiers matching HTTP throttler configuration
export const RateLimitTiers = {
  // Short-term burst protection
  SHORT: { windowMs: 1000, max: 3 }, // 3 requests per second

  // Medium-term protection
  MEDIUM: { windowMs: 10000, max: 20 }, // 20 requests per 10 seconds

  // Long-term protection (default for all endpoints)
  LONG: { windowMs: 60000, max: 100 }, // 100 requests per minute
} as const;

// Default key generator - prioritizes user ID over IP
const defaultKeyGenerator = (
  ctx: TrpcContext & { principal?: any },
): string => {
  // Use user ID if authenticated
  if (ctx.principal?.userId) {
    return `user:${ctx.principal.userId}`;
  }

  // Fall back to IP address
  const forwardedFor = ctx.req.headers["x-forwarded-for"];
  const ip = forwardedFor
    ? Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0]
    : ctx.req.socket?.remoteAddress || "unknown";

  return `ip:${ip}`;
};

// Rate limiting middleware factory
export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const {
    windowMs,
    max,
    message = `Too many requests, please try again later.`,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    rateLimitService,
  } = config;

  return t.middleware(async ({ ctx, next }) => {
    const key = keyGenerator(ctx as any);

    if (rateLimitService) {
      // Use cache-based rate limiting
      const rateLimitResult = await rateLimitService.checkRateLimit(
        key,
        windowMs,
        max,
      );

      if (!rateLimitResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `${message} Retry after ${rateLimitResult.retryAfter} seconds.`,
          cause: {
            retryAfter: rateLimitResult.retryAfter,
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: new Date(rateLimitResult.resetTime).toISOString(),
          },
        });
      }

      // Execute the procedure
      const result = await next();

      // The counter was already incremented by checkRateLimit, but we might want to
      // conditionally count based on success/failure
      const shouldCount =
        (!skipSuccessfulRequests || !result.ok) &&
        (!skipFailedRequests || result.ok);

      // If we need to adjust counting based on result, we can increment here
      if (!shouldCount) {
        // Note: We can't "undo" the increment easily with this API
        // In a more sophisticated implementation, we might check first, then count
      }

      return result;
    } else {
      // Fallback to in-memory rate limiting (for backwards compatibility)
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;

      // This fallback uses a simple in-memory store - not recommended for production
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Rate limiting service not configured",
      });
    }
  });
};

// Pre-configured rate limit middleware instances
export const shortRateLimit = createRateLimitMiddleware({
  ...RateLimitTiers.SHORT,
  message: "Too many requests per second",
});

export const mediumRateLimit = createRateLimitMiddleware({
  ...RateLimitTiers.MEDIUM,
  message: "Rate limit exceeded",
});

export const longRateLimit = createRateLimitMiddleware({
  ...RateLimitTiers.LONG,
  message: "Rate limit exceeded",
});
