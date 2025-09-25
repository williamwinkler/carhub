import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { UUID } from "crypto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { Pagination } from "../../common/types/common.types";
import { UsersAdapter } from "../users/users.adapter";
import { CarModelsAdapter } from "./../car-models/car-models.adapter";
import { CarDto } from "./dto/car.dto";
import { Car } from "./entities/car.entity";

@Injectable()
export class CarsAdapter {
  constructor(
    private readonly usersAdapter: UsersAdapter,
    private readonly carModelsAdapter: CarModelsAdapter,
  ) {}

  public getDto(car: Car): CarDto {
    const userId = Ctx.userId;

    return {
      id: car.id,
      year: car.year,
      color: car.color,
      kmDriven: car.kmDriven,
      price: car.price,
      isFavorite: this.isFavorite(car, userId),
      model: car.model && this.carModelsAdapter.getDto(car.model),
      createdBy: car.createdBy && this.usersAdapter.getUserDto(car.createdBy),
      createdAt: car.createdAt.toISOString(),
      updatedAt: car.updatedAt?.toISOString(),
    };
  }

  public getListDto(input: Pagination<Car>): PaginationDto<CarDto> {
    return {
      items: input.items.map((item) => this.getDto(item)),
      meta: {
        totalItems: input.meta.totalItems,
        count: input.meta.count,
        limit: input.meta.limit,
        skipped: input.meta.skipped,
      },
    };
  }

  private isFavorite(car: Car, userId?: UUID): boolean {
    return (
      (userId && car?.favoritedBy?.some((user) => user.id === userId)) ?? false
    );
  }
}
