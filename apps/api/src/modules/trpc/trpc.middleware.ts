// src/modules/trpc/trpc.middleware.ts
import { Ctx } from "@api/common/ctx";
import { BaseError } from "@api/common/errors/base-error";
import { setupContext } from "@api/common/utils/context.utils";
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
