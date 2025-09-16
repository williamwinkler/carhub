import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ManufacturersService } from "./car-manufacturers.service";
import { CarManufacturer } from "./entities/car-manufacturer.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CarManufacturer])],
  providers: [ManufacturersService],
  exports: [ManufacturersService, TypeOrmModule],
})
export class CarManufacturersModule {}
