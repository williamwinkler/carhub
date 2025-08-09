import { Module } from "@nestjs/common";
import { CarsAdapter } from "./cars.adapter";
import { CarsController } from "./cars.controller";
import { CarsService } from "./cars.service";

@Module({
  controllers: [CarsController],
  providers: [CarsService, CarsAdapter],
})
export class CarsModule {}
