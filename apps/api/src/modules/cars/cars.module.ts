import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ManufacturersModule } from "../manufacturers/manufacturers.module";
import { ModelsModule } from "../models/models.module";
import { CarsAdapter } from "./cars.adapter";
import { CarsController } from "./cars.controller";
import { CarsService } from "./cars.service";
import { CarsTrpc } from "./cars.trpc";
import { Car } from "./entities/car.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Car]),
    ManufacturersModule,
    ModelsModule,
  ],
  controllers: [CarsController],
  providers: [CarsService, CarsAdapter, CarsTrpc],
  exports: [CarsTrpc],
})
export class CarsModule {}
