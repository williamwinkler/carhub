import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarManufacturersModule } from "../car-manufacturers/car-manufacturers.module";
import { CarModelsModule } from "../car-models/car-models.module";
import { UsersModule } from "../users/users.module";
import { CarsAdapter } from "./cars.adapter";
import { CarsController } from "./cars.controller";
import { CarsService } from "./cars.service";
import { Car } from "./entities/car.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Car]),
    CarManufacturersModule,
    CarModelsModule,
    UsersModule,
  ],
  controllers: [CarsController],
  providers: [CarsService, CarsAdapter],
  exports: [CarsService, CarsAdapter],
})
export class CarsModule {}
