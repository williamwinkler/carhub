// src/modules/trpc/trpc.router.ts
import { INestApplication, Injectable } from "@nestjs/common";
import type { AnyRouter } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { CarsTrpc } from "../cars/cars.trpc";
import { TrpcService, createContext } from "./trpc.service";

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly carsTrpc: CarsTrpc,
  ) {}

  // Main app router
  appRouter = this.trpc.router({
    cars: this.carsTrpc.router,
  });

  // Apply tRPC middleware to Nest app
  async applyMiddleware(app: INestApplication) {
    app.use(
      "/trpc",
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
        createContext,
      }),
    );
  }
}

export type AppRouter = TrpcRouter["appRouter"];
