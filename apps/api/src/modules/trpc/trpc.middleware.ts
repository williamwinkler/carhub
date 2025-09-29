import type { Principal } from "@api/common/ctx";
import { Ctx } from "@api/common/ctx";
import type { AppErrorBody } from "@api/common/errors/app-error";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { setupContext } from "@api/common/utils/context.utils";
import type { AuthService } from "@api/modules/auth/auth.service";
import { HttpStatus } from "@nestjs/common";
import { TRPCError, initTRPC } from "@trpc/server";
import { ClsServiceManager } from "nestjs-cls";
import { httpStatusToTrpcCode } from "./trpc.consts";
import type { TrpcContext } from "./trpc.service";

// Create a tRPC instance just for middleware definitions
const t = initTRPC.context<TrpcContext>().create();

// CLS middleware for all tRPC calls
export const clsMiddleware = (authService: AuthService) => {
  return t.middleware(async ({ ctx, next }) => {
    const cls = ClsServiceManager.getClsService();

    return cls.runWith({}, async () => {
      setupContext(ctx.req);

      // If authorized add user to context
      const authorization = ctx.req.headers.authorization;
      if (authorization?.startsWith("Bearer ")) {
        const token = authorization.slice(7); // Remove the "Bearer "
        const payload = await authService.verifyAccessToken(token);
        Ctx.principal = authService.principalFromJwt(payload);
      }

      ctx.res.setHeader("x-request-id", Ctx.requestId);
      ctx.res.setHeader("x-correlation-id", Ctx.correlationId);

      return next();
    });
  });
};

// Error handling middleware
export const errorMiddleware = t.middleware(async ({ next }) => {
  const result = await next();

  // Map the AppError to the corresponding tRPC error code
  if (!result.ok && result.error.cause instanceof AppError) {
    const httpStatus =
      result.error.cause.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const trpcCode =
      httpStatusToTrpcCode[httpStatus] ?? "INTERNAL_SERVER_ERROR";

    const appErrorResponse = result.error.cause.getResponse() as AppErrorBody;
    throw new TRPCError({
      code: trpcCode,
      message: appErrorResponse.message,
      cause: {
        errorCode: appErrorResponse.errorCode,
        errors: appErrorResponse.errors,
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
        throw new AppError(Errors.UNAUTHORIZED);
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
  keyGenerator?: (ctx: TrpcContext & { principal?: Principal }) => string; // Custom key generator
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
  ctx: TrpcContext & { principal?: Principal },
): string => {
  // Use user ID if authenticated
  if (ctx.principal?.id) {
    return `user:${ctx.principal.id}`;
  }

  // Fall back to IP address
  const forwardedFor = ctx.req.headers["x-forwarded-for"];
  const ip = forwardedFor
    ? Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0]
    : (ctx.req.socket?.remoteAddress ?? "unknown");

  return `ip:${ip}`;
};

// Rate limiting middleware factory
export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const {
    windowMs,
    max,
    message = `Too many requests, please try again later.`,
    keyGenerator = defaultKeyGenerator,
    rateLimitService,
  } = config;

  return t.middleware(async ({ ctx, next }) => {
    const key = keyGenerator(ctx);

    if (!rateLimitService) {
      throw new Error("RateLimitService not set");
    }

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
    return await next();
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
