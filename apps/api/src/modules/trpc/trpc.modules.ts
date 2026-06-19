import { Global, Module } from "@nestjs/common";
import { TRPCModule, type TRPCModuleOptions } from "nestjs-trpc";
import { AccountsModule } from "../accounts/accounts.module";
import { AuthModule } from "../auth/auth.module";
import { CarManufacturersModule } from "../car-manufacturers/car-manufacturers.module";
import { CarModelsModule } from "../car-models/car-models.module";
import { CarsModule } from "../cars/cars.module";
import { TrpcRateLimitService } from "./trpc-rate-limit.service";
import { TrpcContextFactory } from "./trpc.context";
import {
  TrpcAdminMiddleware,
  TrpcAuthMiddleware,
  TrpcErrorMiddleware,
  TrpcLongRateLimitMiddleware,
  TrpcMediumRateLimitMiddleware,
  TrpcRequestContextMiddleware,
  TrpcShortRateLimitMiddleware,
} from "./trpc.middlewares";

const trpcModuleOptions: TRPCModuleOptions & { autoSchemaFile: string } = {
  basePath: "/trpc",
  context: TrpcContextFactory,
  autoSchemaFile: "src/@generated",
  globalMiddlewares: [
    TrpcRequestContextMiddleware,
    TrpcErrorMiddleware,
    TrpcLongRateLimitMiddleware,
  ],
};

@Global()
@Module({
  imports: [
    TRPCModule.forRoot(trpcModuleOptions),
    AuthModule,
    CarsModule,
    CarModelsModule,
    CarManufacturersModule,
    AccountsModule,
  ],
  providers: [
    TrpcContextFactory,
    TrpcRequestContextMiddleware,
    TrpcErrorMiddleware,
    TrpcAuthMiddleware,
    TrpcAdminMiddleware,
    TrpcLongRateLimitMiddleware,
    TrpcMediumRateLimitMiddleware,
    TrpcShortRateLimitMiddleware,
    TrpcRateLimitService,
  ],
  exports: [TrpcRateLimitService],
})
export class TrpcModule {}
