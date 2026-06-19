import { Ctx } from "@api/common/ctx";
import type { AppErrorBody } from "@api/common/errors/app-error";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { setupContext } from "@api/common/utils/context.utils";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { TRPCError } from "@trpc/server";
import type {
  MiddlewareOptions,
  MiddlewareResponse,
  TRPCMiddleware,
} from "nestjs-trpc";
import { ClsServiceManager } from "nestjs-cls";
import type { RoleType } from "../users/entities/user.entity";
import { httpStatusToTrpcCode } from "./trpc.consts";
import { TrpcRateLimitService } from "./trpc-rate-limit.service";
import type { TrpcContext } from "./trpc.context";

export const RateLimitTiers = {
  SHORT: { windowMs: 1000, max: 3 },
  MEDIUM: { windowMs: 10000, max: 20 },
  LONG: { windowMs: 60000, max: 100 },
} as const;

type RateLimitTier = keyof typeof RateLimitTiers;

function getClientKey(ctx: TrpcContext): string {
  if (ctx.principal?.id) {
    return `user:${ctx.principal.id}`;
  }

  const forwardedFor = ctx.req.headers["x-forwarded-for"];
  const ip = forwardedFor
    ? Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0]
    : (ctx.req.socket?.remoteAddress ?? "unknown");

  return `ip:${ip}`;
}

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

@Injectable()
export class TrpcRequestContextMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ctx = opts.ctx as TrpcContext;
    const cls = ClsServiceManager.getClsService();

    return cls.runWith({}, async () => {
      setupContext(ctx.req);
      Ctx.principal = ctx.principal;

      ctx.res.setHeader("x-request-id", Ctx.requestId);
      ctx.res.setHeader("x-correlation-id", Ctx.correlationId);

      return opts.next();
    });
  }
}

@Injectable()
export class TrpcErrorMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    try {
      const result = await opts.next();
      if (!result.ok) {
        mapAppError(result.error);
      }

      return result;
    } catch (error) {
      mapAppError(error);
    }
  }
}

@Injectable()
export class TrpcAuthMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ctx = opts.ctx as TrpcContext;
    if (!ctx.principal) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No bearer token provided",
      });
    }

    Ctx.principal = ctx.principal;

    return opts.next({ ctx: { principal: ctx.principal } });
  }
}

@Injectable()
export class TrpcAdminMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ctx = opts.ctx as TrpcContext;
    if (!ctx.principal) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No bearer token provided",
      });
    }

    Ctx.principal = ctx.principal;
    if (ctx.principal.role !== ("admin" satisfies RoleType)) {
      throw new AppError(Errors.FORBIDDEN);
    }

    return opts.next({ ctx: { principal: ctx.principal } });
  }
}

abstract class BaseRateLimitMiddleware implements TRPCMiddleware {
  protected abstract tier: RateLimitTier;
  protected abstract message: string;

  constructor(
    @Inject(TrpcRateLimitService)
    private readonly rateLimitService: TrpcRateLimitService,
  ) {}

  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    const ctx = opts.ctx as TrpcContext;
    const tier = RateLimitTiers[this.tier];
    const key = `${getClientKey(ctx)}:${opts.type}:${opts.path}`;
    const rateLimitResult = await this.rateLimitService.checkRateLimit(
      key,
      tier.windowMs,
      tier.max,
    );

    if (!rateLimitResult.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `${this.message} Retry after ${rateLimitResult.retryAfter} seconds.`,
        cause: {
          retryAfter: rateLimitResult.retryAfter,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        },
      });
    }

    return opts.next();
  }
}

@Injectable()
export class TrpcLongRateLimitMiddleware extends BaseRateLimitMiddleware {
  protected tier: RateLimitTier = "LONG";
  protected message = "Rate limit exceeded";
}

@Injectable()
export class TrpcMediumRateLimitMiddleware extends BaseRateLimitMiddleware {
  protected tier: RateLimitTier = "MEDIUM";
  protected message = "Rate limit exceeded";
}

@Injectable()
export class TrpcShortRateLimitMiddleware extends BaseRateLimitMiddleware {
  protected tier: RateLimitTier = "SHORT";
  protected message = "Too many requests per second";
}
