import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarManufacturer } from "./entities/car-manufacturer.entity";
import { ManufacturersService } from "./manufacturers.service";

@Module({
  imports: [TypeOrmModule.forFeature([CarManufacturer])],
  providers: [ManufacturersService],
  exports: [ManufacturersService, TypeOrmModule],
})
export class ManufacturersModule {}
