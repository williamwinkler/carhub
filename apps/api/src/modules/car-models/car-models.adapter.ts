import { PaginationDto } from "@api/common/dto/pagination.dto";
import { Pagination } from "@api/common/types/common.types";
import { Injectable } from "@nestjs/common";
import { CarManufacturersAdapter } from "./../car-manufacturers/car-manufacturers.adapter";
import { CarModelDto } from "./dto/car-model.dto";
import { CarModel } from "./entities/car-model.entity";

@Injectable()
export class CarModelsAdapter {
  constructor(
    private readonly carManufacturersAdapter: CarManufacturersAdapter,
  ) {}

  getDto(carModel: CarModel): CarModelDto {
    return {
      id: carModel.id,
      name: carModel.name,
      slug: carModel.slug,
      manufacturer:
        carModel.manufacturer &&
        this.carManufacturersAdapter.getDto(carModel.manufacturer),
    };
  }

  getListDto(input: Pagination<CarModel>): PaginationDto<CarModelDto> {
    return {
      items: input.items.map((carModel) => this.getDto(carModel)),
      meta: {
        totalItems: input.meta.totalItems,
        limit: input.meta.limit,
        skipped: input.meta.skipped,
        count: input.meta.count,
      },
    };
  }
}
