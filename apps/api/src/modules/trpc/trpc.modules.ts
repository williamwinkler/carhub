import { Global, Module } from "@nestjs/common";
import { CarsModule } from "../cars/cars.module";
import { TrpcRouter } from "./trpc.router";
import { TrpcService } from "./trpc.service";
import { TrpcRateLimitService } from "./trpc-rate-limit.service";
import { AuthModule } from "../auth/auth.module";

@Global()
@Module({
  imports: [AuthModule, CarsModule],
  providers: [TrpcService, TrpcRouter, TrpcRateLimitService],
  exports: [TrpcService, TrpcRateLimitService],
})
export class TrpcModule {}
