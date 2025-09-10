import { CarNotFoundError } from "@api/common/errors/domain/not-found.error";
import { BadRequestError } from "@api/common/errors/domain/bad-request.error";
import { Injectable, Logger } from "@nestjs/common";
import { CarBrandType } from "@repo/shared";
import { randomUUID, UUID } from "crypto";
import { Pagination } from "../../common/types/pagination";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { Car } from "./entities/car.entity";
import { seedData } from "./entities/data";
import { Role } from "../users/entities/user.entity";

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  /** In Memory database for POC purposes */
  private cars = new Map<UUID, Car>();

  constructor() {
    this.seedCars();
  }

  create(createCarDto: CreateCarDto, createdBy: UUID) {
    const car: Car = {
      id: randomUUID(),
      ...createCarDto,
      createdBy,
      createdAt: new Date(),
      favoritedBy: [],
    };
    this.cars.set(car.id, car);

    this.logger.log("New car created: " + car.id);

    return car;
  }

  findAll(options: {
    brand?: CarBrandType;
    model?: string;
    color?: string;
    skip: number;
    limit: number;
  }): Pagination<Car> {
    const { brand, model, color, skip, limit } = options;

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

  update(id: UUID, dto: UpdateCarDto, updatedBy: UUID, userRole?: Role): Car {
    const car = this.cars.get(id);
    if (!car) {
      throw new CarNotFoundError();
    }

    // Authorization check: only car owners or admins can update
    if (userRole !== 'admin' && car.createdBy !== updatedBy) {
      throw new BadRequestError("You can only update your own cars");
    }

    const updatedCar: Car = {
      ...car,
      ...dto,
      updatedBy,
      updatedAt: new Date(),
    };

    this.cars.set(id, updatedCar);

    this.logger.log("Updated car: " + id);

    return updatedCar;
  }

  remove(id: UUID, userId?: UUID, userRole?: Role): void {
    const car = this.cars.get(id);
    if (!car) {
      throw new CarNotFoundError();
    }

    // Authorization check: only car owners or admins can delete
    if (userId && userRole !== 'admin' && car.createdBy !== userId) {
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
    return Array.from(this.cars.values()).filter(car => 
      car.favoritedBy.includes(userId)
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
