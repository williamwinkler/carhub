// src/modules/trpc/trpc.router.ts
import { INestApplication, Injectable } from "@nestjs/common";
import * as trpcExpress from "@trpc/server/adapters/express";
import { AuthTrpc } from "../auth/auth.trpc";
import { CarsTrpc } from "../cars/cars.trpc";
import { CarModelsTrpc } from "../car-models/car-models.trpc";
import { CarManufacturersTrpc } from "../car-manufacturers/car-manufacturers.trpc";
import { UsersTrpc } from "../users/users.trpc";
import { TrpcService, createContext } from "./trpc.service";

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly authTrpc: AuthTrpc,
    private readonly carsTrpc: CarsTrpc,
    private readonly carModelsTrpc: CarModelsTrpc,
    private readonly carManufacturersTrpc: CarManufacturersTrpc,
    private readonly usersTrpc: UsersTrpc,
  ) {}

  // Main app router
  appRouter = this.trpc.router({
    auth: this.authTrpc.router,
    cars: this.carsTrpc.router,
    carModels: this.carModelsTrpc.router,
    carManufacturers: this.carManufacturersTrpc.router,
    users: this.usersTrpc.router,
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
