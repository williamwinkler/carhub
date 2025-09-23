import { Injectable } from "@nestjs/common";
import { Pagination } from "@api/common/types/common.types";
import { CarManufacturer } from "./entities/car-manufacturer.entity";
import { CarManufacturerDto } from "./dto/car-manufacturer.dto";

@Injectable()
export class CarManufacturersAdapter {
  getDto(carManufacturer: CarManufacturer): CarManufacturerDto {
    return {
      id: carManufacturer.id,
      name: carManufacturer.name,
      slug: carManufacturer.slug,
    };
  }

  getListDto(
    pagination: Pagination<CarManufacturer>,
  ): Pagination<CarManufacturerDto> {
    return {
      items: pagination.items.map((carManufacturer) =>
        this.getDto(carManufacturer),
      ),
      meta: pagination.meta,
    };
  }
}
