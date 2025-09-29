import { Ctx } from "@api/common/ctx";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UUID } from "crypto";
import { Repository } from "typeorm";
import { Pagination } from "../../common/types/common.types";
import { CarModelsService } from "../car-models/car-models.service";
import { User } from "../users/entities/user.entity";
import { FindAllByUserOptions, FindAllCarsOptions } from "./cars.types";
import { CreateCarDto } from "./dto/create-car.dto";
import { UpdateCarDto } from "./dto/update-car.dto";
import { Car } from "./entities/car.entity";

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  constructor(
    @InjectRepository(Car)
    private readonly carsRepo: Repository<Car>,
    private readonly modelsService: CarModelsService,
  ) {}

  // region CREATE
  async create(createCarDto: CreateCarDto) {
    const userId = Ctx.userIdRequired();

    const model = await this.modelsService.findById(createCarDto.modelId);
    if (!model) {
      throw new AppError(Errors.CAR_MODEL_NOT_FOUND);
    }

    const newCar = this.carsRepo.create({
      year: createCarDto.year,
      color: createCarDto.color,
      kmDriven: createCarDto.kmDriven,
      price: createCarDto.price,
      model: model,
      createdBy: { id: userId } as User,
    });

    const savedCar = await this.carsRepo.save(newCar);

    this.logger.log(
      `New car created, a ${model.manufacturer.name} ${model.name}, with ID ${savedCar.id} `,
    );

    return savedCar;
  }

  // region FIND
  async findAll(options: FindAllCarsOptions): Promise<Pagination<Car>> {
    const {
      modelSlug,
      manufacturerSlug,
      color,
      skip,
      limit,
      sortField,
      sortDirection,
    } = options;

    const queryBuilder = this.carsRepo
      .createQueryBuilder("car")
      .leftJoinAndSelect("car.model", "model")
      .leftJoinAndSelect("model.manufacturer", "manufacturer")
      .leftJoinAndSelect("car.createdBy", "createdBy");

    // Only pull out favoritedBy if the we know the user requesting it
    if (Ctx.userId) {
      queryBuilder.leftJoinAndSelect("car.favoritedBy", "favoritedBy");
    }

    // Apply filters
    if (modelSlug) {
      queryBuilder.andWhere("model.slug = :modelSlug", { modelSlug });
    }

    if (manufacturerSlug) {
      queryBuilder.andWhere("manufacturer.slug = :manufacturerSlug", {
        manufacturerSlug,
      });
    }

    if (color) {
      queryBuilder.andWhere("car.color = :color", { color });
    }

    // Apply sorting
    if (sortField && sortDirection) {
      queryBuilder.orderBy(
        `car.${sortField}`,
        sortDirection.toUpperCase() as "ASC" | "DESC",
      );
    }

    // Apply pagination
    if (skip) {
      queryBuilder.skip(skip);
    }

    if (limit) {
      queryBuilder.take(limit);
    }

    const [items, totalItems] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        totalItems,
        limit: limit || totalItems,
        skipped: skip || 0,
        count: items.length,
      },
    };
  }

  async findById(id: UUID): Promise<Car | null> {
    return await this.carsRepo.findOne({
      where: { id },
      relations: ["model", "model.manufacturer", "createdBy", "favoritedBy"],
    });
  }

  async getCarsByUser(options: FindAllByUserOptions): Promise<Pagination<Car>> {
    const { userId, skip, limit } = options;

    const [cars, totalItems] = await this.carsRepo.findAndCount({
      where: { createdBy: { id: userId } },
      relations: {
        model: true,
      },
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    return {
      items: cars,
      meta: {
        totalItems,
        limit,
        skipped: skip,
        count: cars.length,
      },
    };
  }

  // region UPDATE
  async update(id: UUID, dto: UpdateCarDto): Promise<Car> {
    const car = await this.findById(id);
    if (!car) {
      throw new AppError(Errors.CAR_NOT_FOUND);
    }

    // Authorization check: only car owners or admins can update
    const principal = Ctx.principalRequired();
    if (car.createdBy.id !== principal.id && principal.role !== "admin") {
      throw new AppError(Errors.USERS_CAN_ONLY_UPDATE_OWN_CARS);
    }

    const updatedCar = this.carsRepo.create({
      ...car,
      ...dto,
    });

    if (dto.modelId) {
      const carModel = await this.modelsService.findById(dto.modelId);
      if (!carModel) {
        throw new AppError(Errors.CAR_MODEL_NOT_FOUND);
      }

      updatedCar.model = carModel;
    }

    const saved = await this.carsRepo.save(updatedCar);
    this.logger.log("Updated car: " + id);

    return saved;
  }

  // region DELETE
  async softDelete(id: UUID): Promise<void> {
    const car = await this.findById(id);
    if (!car) {
      throw new AppError(Errors.CAR_NOT_FOUND);
    }

    // Authorization check: only car owners or admins can delete
    const principal = Ctx.principalRequired();
    if (car.createdBy.id !== principal.id && principal.role !== "admin") {
      throw new AppError(Errors.USERS_CAN_ONLY_UPDATE_OWN_CARS);
    }

    await this.carsRepo.softDelete({ id });

    this.logger.log("Car deleted: " + id);
  }

  async toggleFavoriteForUser(id: UUID, userId: UUID): Promise<boolean> {
    const car = await this.carsRepo.findOne({
      where: { id },
      relations: ["favoritedBy"],
    });

    if (!car) {
      throw new AppError(Errors.CAR_NOT_FOUND);
    }

    const isFavorited = car.favoritedBy.some((user) => user.id === userId);

    if (isFavorited) {
      // Remove user from favorites
      car.favoritedBy = car.favoritedBy.filter((user) => user.id !== userId);
    } else {
      // Add user to favorites - we need to create a user reference
      car.favoritedBy.push({ id: userId } as User);
    }

    await this.carsRepo.save(car);
    this.logger.log(
      `User ${userId} toggled favorite for car ${id} to ${!isFavorited}`,
    );

    return isFavorited;
  }

  async getFavoritesByUser(
    options: FindAllByUserOptions,
  ): Promise<Pagination<Car>> {
    const { userId, skip, limit } = options;

    const queryBuilder = this.carsRepo
      .createQueryBuilder("car")
      .leftJoinAndSelect("car.model", "model")
      .leftJoinAndSelect("model.manufacturer", "manufacturer")
      .leftJoinAndSelect("car.createdBy", "createdBy")
      .innerJoin("car.favoritedBy", "user")
      .where("user.id = :userId", { userId });

    // Apply pagination
    if (skip) {
      queryBuilder.skip(skip);
    }

    if (limit) {
      queryBuilder.take(limit);
    }

    const [items, totalItems] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        totalItems,
        limit: limit || totalItems,
        skipped: skip || 0,
        count: items.length,
      },
    };
  }
}
