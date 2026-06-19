import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarManufacturersModule } from "../car-manufacturers/car-manufacturers.module";
import { CarModelsAdapter } from "./car-models.adapter";
import { CarModelsController } from "./car-models.controller";
import { CarModelsService } from "./car-models.service";
import { CarModel } from "./entities/car-model.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CarModel]), CarManufacturersModule],
  controllers: [CarModelsController],
  providers: [CarModelsService, CarModelsAdapter],
  exports: [CarModelsService, CarModelsAdapter, TypeOrmModule],
})
export class CarModelsModule {}
