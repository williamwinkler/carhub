import { Injectable, Logger } from "@nestjs/common";
import { randomUUID, UUID } from "crypto";
import { NotFoundError } from "../../common/errors/not-found.error.dto";
import { Pagination } from "../../common/types/pagination";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { Car, CarBrand } from "./entities/car.entity";
import { seedData } from "./entities/data";

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  /** In Memory database for POC purposes */
  private cars = new Map<UUID, Car>();

  constructor() {
    this.seedCars();
  }

  create(createCarDto: CreateCarDto) {
    const car: Car = {
      id: randomUUID(),
      ...createCarDto,
    };
    this.cars.set(car.id, car);

    this.logger.log("New car created: " + car.id);

    return car;
  }

  findAll(options: {
    brand?: CarBrand;
    model?: string;
    color?: string;
    skip: number;
    limit: number;
  }): Pagination<Car> {
    const { brand, model, color, skip, limit } = options;

    let cars = Array.from(this.cars.values()).filter((car) => {
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
    cars = cars.slice(skip, skip + limit);

    return {
      items: cars,
      meta: {
        total: this.cars.size,
        limit,
        skipped: skip,
        count: cars.length,
      },
    };
  }

  findById(id: UUID): Car {
    const car = this.cars.get(id);
    if (!car) {
      throw new NotFoundError("Car");
    }

    return car;
  }

  update(id: UUID, dto: UpdateCarDto): Car {
    const car = this.cars.get(id);
    if (!car) {
      throw new NotFoundError("Car");
    }

    const updatedCar: Car = {
      ...car,
      ...dto,
    };

    this.cars.set(id, updatedCar);

    this.logger.log("Updated car: " + id);

    return updatedCar;
  }

  remove(id: UUID): void {
    const isDeleted = this.cars.delete(id);
    if (!isDeleted) {
      throw new NotFoundError("Car");
    }

    this.logger.log("Car deleted: " + id);
  }

  // region PRIVATE

  private seedCars() {
    seedData.forEach((carData) => {
      const car: Car = {
        id: randomUUID(),
        ...carData,
      };
      this.cars.set(car.id, car);
    });
  }
}
