// src/modules/trpc/trpc.service.ts
import { Injectable } from "@nestjs/common";
import { initTRPC } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { clsMiddleware, errorMiddleware } from "./trpc.middleware";

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
  // Create tRPC instance with context type
  trpc = initTRPC.context<TrpcContext>().create();

  // Base procedure with CLS + error handling
  procedure = this.trpc.procedure.use(clsMiddleware).use(errorMiddleware);

  router = this.trpc.router;
  middleware = this.trpc.middleware;
  mergeRouters = this.trpc.mergeRouters;
}
