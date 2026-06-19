import type { INestApplication } from "@nestjs/common";
import { Inject, Injectable, Logger } from "@nestjs/common";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createAccountsRouter } from "../accounts/accounts.trpc";
import { AccountsAdapter } from "../accounts/acounts.adapter";
import { AuthService } from "../auth/auth.service";
import { createAuthRouter } from "../auth/auth.trpc";
import { CarManufacturersAdapter } from "../car-manufacturers/car-manufacturers.adapter";
import { CarManufacturersService } from "../car-manufacturers/car-manufacturers.service";
import { createCarManufacturersRouter } from "../car-manufacturers/car-manufacturers.trpc";
import { CarModelsAdapter } from "../car-models/car-models.adapter";
import { CarModelsService } from "../car-models/car-models.service";
import { createCarModelsRouter } from "../car-models/car-models.trpc";
import { CarsAdapter } from "../cars/cars.adapter";
import { CarsService } from "../cars/cars.service";
import { createCarsRouter } from "../cars/cars.trpc";
import { UsersService } from "../users/users.service";
import { TrpcContextFactory } from "./trpc.context";
import { TrpcService } from "./trpc.service";

export type AppRouterDeps = {
  trpc: TrpcService;
  authService: AuthService;
  usersService: UsersService;
  accountsAdapter: AccountsAdapter;
  carsService: CarsService;
  carsAdapter: CarsAdapter;
  carModelsService: CarModelsService;
  carModelsAdapter: CarModelsAdapter;
  manufacturersService: CarManufacturersService;
  manufacturersAdapter: CarManufacturersAdapter;
};

export function createAppRouter(deps: AppRouterDeps) {
  return deps.trpc.router({
    accounts: createAccountsRouter(deps),
    auth: createAuthRouter(deps),
    carManufacturers: createCarManufacturersRouter(deps),
    carModels: createCarModelsRouter(deps),
    cars: createCarsRouter(deps),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

@Injectable()
export class TrpcRouter {
  private readonly logger = new Logger(TrpcRouter.name);
  readonly appRouter: AppRouter;

  constructor(
    @Inject(TrpcService) private readonly trpc: TrpcService,
    @Inject(TrpcContextFactory)
    private readonly contextFactory: TrpcContextFactory,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(AccountsAdapter) private readonly accountsAdapter: AccountsAdapter,
    @Inject(CarsService) private readonly carsService: CarsService,
    @Inject(CarsAdapter) private readonly carsAdapter: CarsAdapter,
    @Inject(CarModelsService)
    private readonly carModelsService: CarModelsService,
    @Inject(CarModelsAdapter)
    private readonly carModelsAdapter: CarModelsAdapter,
    @Inject(CarManufacturersService)
    private readonly manufacturersService: CarManufacturersService,
    @Inject(CarManufacturersAdapter)
    private readonly manufacturersAdapter: CarManufacturersAdapter,
  ) {
    this.appRouter = createAppRouter({
      trpc: this.trpc,
      authService: this.authService,
      usersService: this.usersService,
      accountsAdapter: this.accountsAdapter,
      carsService: this.carsService,
      carsAdapter: this.carsAdapter,
      carModelsService: this.carModelsService,
      carModelsAdapter: this.carModelsAdapter,
      manufacturersService: this.manufacturersService,
      manufacturersAdapter: this.manufacturersAdapter,
    });
  }

  applyMiddleware(app: INestApplication): void {
    app.use(
      "/trpc",
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
        createContext: (opts) => this.contextFactory.create(opts),
        onError: ({ error, path, type }) => {
          const message = `tRPC ${type} ${path ?? "<unknown>"} failed: ${error.message}`;
          if (error.code === "INTERNAL_SERVER_ERROR") {
            this.logger.error(message, error.stack);
            return;
          }

          this.logger.warn(message);
        },
      }),
    );
  }
}
