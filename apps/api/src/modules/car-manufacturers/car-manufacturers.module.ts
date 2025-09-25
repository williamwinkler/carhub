import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarManufacturersAdapter } from "./car-manufacturers.adapter";
import { CarManufacturersController } from "./car-manufacturers.controller";
import { CarManufacturersService } from "./car-manufacturers.service";
import { CarManufacturersTrpc } from "./car-manufacturers.trpc";
import { CarManufacturer } from "./entities/car-manufacturer.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CarManufacturer])],
  controllers: [CarManufacturersController],
  providers: [
    CarManufacturersService,
    CarManufacturersAdapter,
    CarManufacturersTrpc,
  ],
  exports: [
    CarManufacturersService,
    CarManufacturersAdapter,
    CarManufacturersTrpc,
    TypeOrmModule,
  ],
})
export class CarManufacturersModule {}
