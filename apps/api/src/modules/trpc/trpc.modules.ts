import { Global, Module } from "@nestjs/common";
import { CarsModule } from "../cars/cars.module";
import { TrpcRouter } from "./trpc.router";
import { TrpcService } from "./trpc.service";
import { AuthModule } from "../auth/auth.module";

@Global()
@Module({
  imports: [AuthModule, CarsModule],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService],
})
export class TrpcModule {}
