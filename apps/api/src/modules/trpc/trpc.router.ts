// src/modules/trpc/trpc.router.ts
import { INestApplication, Injectable } from "@nestjs/common";
import * as trpcExpress from "@trpc/server/adapters/express";
import { AuthTrpc } from "../auth/auth.trpc";
import { CarsTrpc } from "../cars/cars.trpc";
import { CarModelsTrpc } from "../car-models/car-models.trpc";
import { CarManufacturersTrpc } from "../car-manufacturers/car-manufacturers.trpc";
import { TrpcService, createContext } from "./trpc.service";
import { AccountsTrpc } from "../accounts/accounts.trpc";

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authTrpc: AuthTrpc,
    private readonly carsTrpc: CarsTrpc,
    private readonly carModelsTrpc: CarModelsTrpc,
    private readonly carManufacturersTrpc: CarManufacturersTrpc,
    private readonly accountsTrpc: AccountsTrpc,
  ) {}

  // Main app router
  appRouter = this.trpc.router({
    auth: this.authTrpc.router,
    cars: this.carsTrpc.router,
    carModels: this.carModelsTrpc.router,
    carManufacturers: this.carManufacturersTrpc.router,
    accounts: this.accountsTrpc.router,
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
