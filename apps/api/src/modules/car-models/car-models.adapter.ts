import { PaginationDto } from "@api/common/dto/pagination.dto";
import { Pagination } from "@api/common/types/common.types";
import { Injectable } from "@nestjs/common";
import { CarModelDto } from "./dto/car-model.dto";
import { CarModel } from "./entities/car-model.entity";

@Injectable()
export class CarModelsAdapter {
  getDto(carModel: CarModel): CarModelDto {
    return {
      id: carModel.id,
      name: carModel.name,
      slug: carModel.slug,
      manufacturerId: carModel.manufacturer.id,
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
