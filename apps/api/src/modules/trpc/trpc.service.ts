// src/modules/trpc/trpc.service.ts
import { NotFoundError } from "@api/common/errors/not-found.error.dto";
import { setupRequestContext } from "@api/common/utils/context.utils";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ClsServiceManager } from "nestjs-cls";

// tRPC context type
export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
};

// Create context function for tRPC
export function createContext({
  req,
  res,
}: CreateExpressContextOptions): TrpcContext {
  return { req, res };
}

@Injectable()
export class TrpcService {
  // Create tRPC instance with context type
  trpc = initTRPC.context<TrpcContext>().create();

  // CLS middleware for all tRPC calls
  private clsMiddleware = this.trpc.middleware(async ({ ctx, next }) => {
    const cls = ClsServiceManager.getClsService();

    return cls.runWith({}, async () => {
      setupRequestContext(ctx.req);

      return next();
    });
  });

  // Error handling middleware
  private errorMiddleware = this.trpc.middleware(async ({ next }) => {
    const result = await next();
    if (!result.ok) {
      if (result.error.cause instanceof NotFoundError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: result.error.cause.message,
        });
      }

      if (result.error.cause instanceof UnauthorizedException) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: result.error.cause.message,
        });
      }
    }

    return result;
  });

  // Base procedure with CLS + error handling
  procedure = this.trpc.procedure
    .use(this.clsMiddleware)
    .use(this.errorMiddleware);
  router = this.trpc.router;
  middleware = this.trpc.middleware;
  mergeRouters = this.trpc.mergeRouters;
}
