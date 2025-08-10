import { INestApplication, Injectable } from "@nestjs/common";

import * as trpcExpress from "@trpc/server/adapters/express";
import { CarsTrpc } from "../cars/cars.trpc";
import { TrpcService } from "./trpc.service";

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly carsTrpc: CarsTrpc,
  ) {}

  appRouter = this.trpc.router({
    cars: this.carsTrpc.router,
  });

  async applyMiddleware(app: INestApplication) {
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
      }),
    );
  }
}

export type AppRouter = TrpcRouter[`appRouter`];
