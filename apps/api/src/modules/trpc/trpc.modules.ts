import { Global, Module } from "@nestjs/common";
import { AccountsModule } from "../accounts/accounts.module";
import { AuthModule } from "../auth/auth.module";
import { CarManufacturersModule } from "../car-manufacturers/car-manufacturers.module";
import { CarModelsModule } from "../car-models/car-models.module";
import { CarsModule } from "../cars/cars.module";
import { UsersModule } from "../users/users.module";
import { TrpcRateLimitService } from "./trpc-rate-limit.service";
import { TrpcContextFactory } from "./trpc.context";
import { TrpcRouter } from "./trpc.router";
import { TrpcService } from "./trpc.service";

@Global()
@Module({
  imports: [
    AuthModule,
    UsersModule,
    CarsModule,
    CarModelsModule,
    CarManufacturersModule,
    AccountsModule,
  ],
  providers: [
    TrpcService,
    TrpcRouter,
    TrpcContextFactory,
    TrpcRateLimitService,
  ],
  exports: [TrpcRateLimitService, TrpcRouter, TrpcService],
})
export class TrpcModule {}
