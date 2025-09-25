import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarModelsService } from "./car-models.service";
import { CarModel } from "./entities/car-model.entity";
import { CarModelsController } from "./car-models.controller";
import { CarModelsAdapter } from "./car-models.adapter";
import { CarModelsTrpc } from "./car-models.trpc";
import { CarManufacturersModule } from "../car-manufacturers/car-manufacturers.module";

@Module({
  imports: [TypeOrmModule.forFeature([CarModel]), CarManufacturersModule],
  controllers: [CarModelsController],
  providers: [CarModelsService, CarModelsAdapter, CarModelsTrpc],
  exports: [CarModelsService, CarModelsTrpc, CarModelsAdapter, TypeOrmModule],
})
export class CarModelsModule {}
