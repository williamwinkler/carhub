import { Module } from "@nestjs/common";
import { CarsAdapter } from "./cars.adapter";
import { CarsController } from "./cars.controller";
import { CarsService } from "./cars.service";
import { CarsTrpc } from "./cars.trpc";

@Module({
  imports: [],
  controllers: [CarsController],
  providers: [CarsService, CarsAdapter, CarsTrpc],
  exports: [CarsTrpc],
})
export class CarsModule {}
