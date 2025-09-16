import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarModelsService } from "./car-models.service";
import { CarModel } from "./entities/car-model.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CarModel])],
  providers: [CarModelsService],
  exports: [CarModelsService, TypeOrmModule],
})
export class CarModelsModule {}
