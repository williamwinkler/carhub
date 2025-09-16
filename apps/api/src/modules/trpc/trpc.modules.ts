import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CarsModule } from "../cars/cars.module";
import { UsersModule } from "../users/users.module";
import { TrpcRateLimitService } from "./trpc-rate-limit.service";
import { TrpcRouter } from "./trpc.router";
import { TrpcService } from "./trpc.service";

@Global()
@Module({
  imports: [AuthModule, CarsModule, UsersModule],
  providers: [TrpcService, TrpcRouter, TrpcRateLimitService],
  exports: [TrpcService, TrpcRateLimitService],
})
export class TrpcModule {}
