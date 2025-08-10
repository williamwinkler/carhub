import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { CarsModule } from "./modules/cars/cars.module";
import { TrpcModule } from "./modules/trpc/trpc.modules";

@Module({
  imports: [ConfigModule.forRoot(), TrpcModule, CarsModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
