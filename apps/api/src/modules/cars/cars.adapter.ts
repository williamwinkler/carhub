import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { Pagination } from "../../common/types/pagination";
import { CarDto } from "./dto/car.dto";
import { Car } from "./entities/car.entity";

@Injectable()
export class CarsAdapter {
  public getDto(car: Car): CarDto {
    const userId = Ctx.userId;

    return {
      id: car.id,
      // model: car.model,
      year: car.year,
      color: car.color,
      kmDriven: car.kmDriven,
      price: car.price,
      createdBy: car.createdBy,
      createdAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt?.toISOString(),
      isFavorite:
        (userId && car?.favoritedBy?.some((user) => user.id === userId)) ??
        false,
    };
  }

  public getListDto(input: Pagination<Car>): PaginationDto<CarDto> {
    return {
      items: input.items.map((item) => this.getDto(item)),
      meta: {
        total: input.meta.totalItems,
        count: input.meta.count,
        limit: input.meta.limit,
        skipped: input.meta.skipped,
      },
    };
  }
}
