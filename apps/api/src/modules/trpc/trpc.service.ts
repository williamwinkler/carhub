// src/modules/trpc/trpc.service.ts
import { Ctx } from "@api/common/ctx";
import type { AppErrorBody } from "@api/common/errors/app-error";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { setupContext } from "@api/common/utils/context.utils";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { initTRPC, TRPCError } from "@trpc/server";
import { ClsServiceManager } from "nestjs-cls";
import type { RoleType } from "../users/entities/user.entity";
import { httpStatusToTrpcCode } from "./trpc.consts";
import type { TrpcContext } from "./trpc.context";
import { TrpcRateLimitService } from "./trpc-rate-limit.service";

export const RateLimitTiers = {
  SHORT: { windowMs: 1000, max: 3 },
  MEDIUM: { windowMs: 10000, max: 20 },
  LONG: { windowMs: 60000, max: 100 },
} as const;

type RateLimitTier = keyof typeof RateLimitTiers;
type OperationType = "query" | "mutation" | "subscription";

function mapAppError(error: unknown): never {
  const appError =
    error instanceof AppError
      ? error
      : error instanceof TRPCError && error.cause instanceof AppError
        ? error.cause
        : null;

  if (!appError) {
    throw error;
  }

  const httpStatus = appError.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
  const trpcCode = httpStatusToTrpcCode[httpStatus] ?? "INTERNAL_SERVER_ERROR";
  const appErrorResponse = appError.getResponse() as AppErrorBody;

  throw new TRPCError({
    code: trpcCode,
    message: appErrorResponse.message,
    cause: {
      errorCode: appErrorResponse.errorCode,
      errors: appErrorResponse.errors,
    },
  });
}

function getClientKey(ctx: TrpcContext): string {
  if (ctx.principal?.id) {
    return `user:${ctx.principal.id}`;
  }

  return `ip:${ctx.req.ip ?? ctx.req.socket?.remoteAddress ?? "unknown"}`;
}

@Injectable()
export class TrpcService {
  constructor(
    @Inject(TrpcRateLimitService)
    private readonly rateLimitService: TrpcRateLimitService,
  ) {}

  trpc = initTRPC.context<TrpcContext>().create();

  private requestContextMiddleware = this.trpc.middleware(({ ctx, next }) => {
    const cls = ClsServiceManager.getClsService();

    return cls.runWith({}, () => {
      setupContext(ctx.req);
      Ctx.principal = ctx.principal;

      ctx.res.setHeader("x-request-id", Ctx.requestId);
      ctx.res.setHeader("x-correlation-id", Ctx.correlationId);

      return next();
    });
  });

  private errorMiddleware = this.trpc.middleware(async ({ next }) => {
    try {
      const result = await next();
      if (!result.ok) {
        mapAppError(result.error);
      }

      return result;
    } catch (error) {
      mapAppError(error);
    }
  });

  private requirePrincipalMiddleware = this.trpc.middleware(({ ctx, next }) => {
    const { principal } = ctx;
    if (!principal) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No bearer token provided",
      });
    }

    Ctx.principal = principal;

    return next({ ctx: { principal } });
  });

  private requireAdminMiddleware = this.trpc.middleware(({ ctx, next }) => {
    if (ctx.principal?.role !== ("admin" satisfies RoleType)) {
      throw new AppError(Errors.FORBIDDEN);
    }

    return next();
  });

  private createRateLimitMiddleware = (
    tierName: RateLimitTier,
    message: string,
  ) => {
    const tier = RateLimitTiers[tierName];

    return this.trpc.middleware(async ({ ctx, next, path, type }) => {
      const key = `${getClientKey(ctx)}:${type as OperationType}:${path}`;
      const rateLimitResult = await this.rateLimitService.checkRateLimit(
        key,
        tier.windowMs,
        tier.max,
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

      return next();
    });
  };

  private longRateLimitMiddleware = this.createRateLimitMiddleware(
    "LONG",
    "Rate limit exceeded",
  );

  private mediumRateLimitMiddleware = this.createRateLimitMiddleware(
    "MEDIUM",
    "Rate limit exceeded",
  );

  private shortRateLimitMiddleware = this.createRateLimitMiddleware(
    "SHORT",
    "Too many requests per second",
  );

  private defaultRateLimitedProcedure = this.trpc.procedure
    .use(this.requestContextMiddleware)
    .use(this.errorMiddleware)
    .use(this.longRateLimitMiddleware);

  publicProcedure = this.defaultRateLimitedProcedure;
  protectedProcedure = this.defaultRateLimitedProcedure.use(
    this.requirePrincipalMiddleware,
  );
  adminProcedure = this.protectedProcedure.use(this.requireAdminMiddleware);

  publicShortProcedure = this.publicProcedure.use(
    this.shortRateLimitMiddleware,
  );
  publicMediumProcedure = this.publicProcedure.use(
    this.mediumRateLimitMiddleware,
  );
  protectedShortProcedure = this.protectedProcedure.use(
    this.shortRateLimitMiddleware,
  );
  protectedMediumProcedure = this.protectedProcedure.use(
    this.mediumRateLimitMiddleware,
  );

  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;
  middleware = this.trpc.middleware;
}
