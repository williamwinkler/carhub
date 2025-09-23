import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ManufacturersService } from "./car-manufacturers.service";
import { CarManufacturer } from "./entities/car-manufacturer.entity";
import { CarManufacturersController } from "./car-manufacturers.controller";
import { CarManufacturersAdapter } from "./car-manufacturers.adapter";
import { CarManufacturersTrpc } from "./car-manufacturers.trpc";

@Module({
  imports: [TypeOrmModule.forFeature([CarManufacturer])],
  controllers: [CarManufacturersController],
  providers: [
    ManufacturersService,
    CarManufacturersAdapter,
    CarManufacturersTrpc,
  ],
  exports: [ManufacturersService, CarManufacturersTrpc, TypeOrmModule],
})
export class CarManufacturersModule {}
