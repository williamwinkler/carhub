import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarManufacturersModule } from "../car-manufacturers/car-manufacturers.module";
import { CarModelsModule } from "../car-models/car-models.module";
import { CarsAdapter } from "./cars.adapter";
import { CarsController } from "./cars.controller";
import { CarsService } from "./cars.service";
import { CarsTrpc } from "./cars.trpc";
import { Car } from "./entities/car.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Car]),
    CarManufacturersModule,
    CarModelsModule,
  ],
  controllers: [CarsController],
  providers: [CarsService, CarsAdapter, CarsTrpc],
  exports: [CarsTrpc],
})
export class CarsModule {}
