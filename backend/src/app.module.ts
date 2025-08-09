import { Module } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { CommonModule } from "./common/common.module";
import { CarsModule } from "./modules/cars/cars.module";

@Module({
  imports: [CommonModule, CarsModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
