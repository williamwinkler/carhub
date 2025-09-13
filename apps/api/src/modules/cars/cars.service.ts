import { Ctx } from "@api/common/ctx";
import { BadRequestError } from "@api/common/errors/domain/bad-request.error";
import { CarNotFoundError } from "@api/common/errors/domain/not-found.error";
import { Injectable, Logger } from "@nestjs/common";
import { randomUUID, UUID } from "crypto";
import { Pagination } from "../../common/types/pagination";
import { FindAllCarsOptions } from "./cars.type";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { Car } from "./entities/car.entity";
import { seedData } from "./entities/data";

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  /** In Memory database for POC purposes */
  private cars = new Map<UUID, Car>();

  constructor() {
    this.seedCars();
  }

  // region CREATE
  create(createCarDto: CreateCarDto) {
    const car: Car = {
      id: randomUUID(),
      ...createCarDto,
      createdBy: Ctx.userIdRequired(),
      createdAt: new Date(),
      favoritedBy: [],
    };
    this.cars.set(car.id, car);

    this.logger.log("New car created: " + car.id);

    return car;
  }

  // region FIND
  findAll(options: FindAllCarsOptions): Pagination<Car> {
    const { brand, model, color, skip, limit, sortField, sortDirection } =
      options;

    const cars = Array.from(this.cars.values()).filter((car) => {
      if (brand && car.brand !== brand) {
        return false;
      }

      if (model && car.model.toLowerCase() !== model.toLowerCase()) {
        return false;
      }

      if (color && car.color.toLowerCase() !== color.toLowerCase()) {
        return false;
      }

      return true;
    });

    // Apply sorting
    if (sortField && sortDirection) {
      cars.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
        }

        if (typeof bVal === "string") {
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) {
          return sortDirection === "asc" ? -1 : 1;
        }

        if (aVal > bVal) {
          return sortDirection === "asc" ? 1 : -1;
        }

        return 0;
      });
    }

    // Apply pagination
    const paginatedCars = cars.slice(skip, skip + limit);

    return {
      items: paginatedCars,
      meta: {
        totalItems: cars.length,
        limit,
        skipped: skip,
        count: paginatedCars.length,
      },
    };
  }

  findById(id: UUID): Car {
    const car = this.cars.get(id);

    if (!car) {
      throw new CarNotFoundError();
    }

    return car;
  }

  // region UPDATE
  update(id: UUID, dto: UpdateCarDto): Car {
    const principal = Ctx.principalRequired();
    const role = Ctx.roleRequired();

    const car = this.cars.get(id);
    if (!car) {
      throw new CarNotFoundError();
    }

    // Authorization check: only car owners or admins can update
    if (car.createdBy !== principal.id && principal.role !== "admin") {
      throw new BadRequestError("You can only update your own cars");
    }

    const updatedCar: Car = {
      ...car,
      ...dto,
      updatedBy: principal.id,
      updatedAt: new Date(),
    };

    this.cars.set(id, updatedCar);

    this.logger.log("Updated car: " + id);

    return updatedCar;
  }

  // region DELETE
  delete(id: UUID): void {
    const userId = Ctx.userIdRequired();
    const role = Ctx.roleRequired();

    const car = this.cars.get(id);
    if (!car) {
      throw new CarNotFoundError();
    }

    // Authorization check: only car owners or admins can delete
    if (car.createdBy !== userId && role !== "admin") {
      throw new BadRequestError("You can only delete your own cars");
    }

    const isDeleted = this.cars.delete(id);
    if (!isDeleted) {
      throw new CarNotFoundError();
    }

    this.logger.log("Car deleted: " + id);
  }

  toggleFavorite(carId: UUID, userId: UUID): Car {
    const car = this.cars.get(carId);
    if (!car) {
      throw new CarNotFoundError();
    }

    const favoriteIndex = car.favoritedBy.indexOf(userId);
    if (favoriteIndex === -1) {
      car.favoritedBy.push(userId);
    } else {
      car.favoritedBy.splice(favoriteIndex, 1);
    }

    this.cars.set(carId, car);
    this.logger.log(`User ${userId} toggled favorite for car: ${carId}`);

    return car;
  }

  getFavoritesByUser(userId: UUID): Car[] {
    return Array.from(this.cars.values()).filter((car) =>
      car.favoritedBy.includes(userId),
    );
  }

  // region PRIVATE

  private seedCars() {
    seedData.forEach((carData) => {
      const car: Car = {
        id: randomUUID(),
        ...carData,
        createdBy: "00000000-0000-0000-0000-000000000000", // System user for seed data
        createdAt: new Date(),
        favoritedBy: [],
      };
      this.cars.set(car.id, car);
    });
  }
}
