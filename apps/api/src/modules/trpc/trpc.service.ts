import { NotFoundError } from "@api/common/errors/not-found.error.dto";
import { Injectable } from "@nestjs/common";
import { initTRPC, TRPCError } from "@trpc/server";

@Injectable()
export class TrpcService {
  trpc = initTRPC.create();

  private globalMiddleware = this.trpc.middleware(async ({ next }) => {
    const result = await next();

    // Convert internal errors to tRPC errors here
    if (!result.ok) {
      if (result.error.cause instanceof NotFoundError) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: result.error.cause.message,
        });
      }
    }

    return result;
  });

  procedure = this.trpc.procedure.use(this.globalMiddleware);
  router = this.trpc.router;
  middleware = this.trpc.middleware;
  mergeRouters = this.trpc.mergeRouters;
}
