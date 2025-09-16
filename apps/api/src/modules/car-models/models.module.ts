import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CarModel } from "./entities/car-model.entity";
import { ModelsService } from "./models.service";

@Module({
  imports: [TypeOrmModule.forFeature([CarModel])],
  providers: [ModelsService],
  exports: [ModelsService, TypeOrmModule],
})
export class ModelsModule {}
