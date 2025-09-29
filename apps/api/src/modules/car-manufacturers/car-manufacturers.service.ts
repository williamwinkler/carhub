import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { Pagination } from "@api/common/types/common.types";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UUID } from "crypto";
import { slug } from "github-slugger";
import { Repository } from "typeorm";
import { FindAllCarManufacturersOptions } from "./car-manufacturers.types";
import { CreateCarManufacturerDto } from "./dto/create-car-manufacturer.dto";
import { UpdateCarManufacturerDto } from "./dto/update-car-manufacturer.dto";
import { CarManufacturer } from "./entities/car-manufacturer.entity";

@Injectable()
export class CarManufacturersService {
  private readonly logger = new Logger(CarManufacturersService.name);

  constructor(
    @InjectRepository(CarManufacturer)
    private manufacturersRepo: Repository<CarManufacturer>,
  ) {}

  // region CREATE
  async create(options: CreateCarManufacturerDto): Promise<CarManufacturer> {
    const manufacturer = this.manufacturersRepo.create({
      name: options.name,
      slug: slug(options.name),
    });

    const manufacturerExists = await this.manufacturersRepo.findOne({
      where: [{ name: manufacturer.name }, { slug: manufacturer.slug }],
    });
    if (manufacturerExists) {
      throw new AppError(Errors.CAR_MANUFACTURER_ALREADY_EXISTS);
    }

    const savedManufacturer = await this.manufacturersRepo.save(manufacturer);

    this.logger.log(`Created new manufacturer: ${savedManufacturer.name}`);

    return savedManufacturer;
  }

  // region FIND
  async findAll(
    options: FindAllCarManufacturersOptions,
  ): Promise<Pagination<CarManufacturer>> {
    const { skip, limit, sortField, sortDirection } = options;

    const queryBuilder = this.manufacturersRepo
      .createQueryBuilder("carManufacturer")
      .leftJoinAndSelect("carManufacturer.models", "models");

    // Apply sorting
    if (sortField && sortDirection) {
      queryBuilder.orderBy(
        `carManufacturer.${sortField}`,
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
        limit: limit ?? totalItems,
        skipped: skip ?? 0,
        count: items.length,
      },
    };
  }

  async findById(id: UUID): Promise<CarManufacturer | null> {
    return this.manufacturersRepo.findOne({
      where: { id },
      relations: ["models"],
    });
  }

  async findBySlug(slug: string): Promise<CarManufacturer | null> {
    return this.manufacturersRepo.findOne({
      where: { slug },
      relations: ["models"],
    });
  }

  // region UPDATE
  async update(
    id: UUID,
    dto: UpdateCarManufacturerDto,
  ): Promise<CarManufacturer> {
    const carManufacturer = await this.findById(id);
    if (!carManufacturer) {
      throw new AppError(Errors.CAR_MANUFACTURER_NOT_FOUND);
    }

    const updatedCarManufacturer = this.manufacturersRepo.create({
      ...carManufacturer,
      ...dto,
    });

    const saved = await this.manufacturersRepo.save(updatedCarManufacturer);
    this.logger.log(`Updated manufacturer: ${id}`);

    return saved;
  }

  // region DELETE
  async delete(id: UUID): Promise<void> {
    const carManufacturer = await this.findById(id);
    if (!carManufacturer) {
      throw new AppError(Errors.CAR_MANUFACTURER_NOT_FOUND);
    }

    await this.manufacturersRepo.delete(id);
    this.logger.log(`Deleted manufacturer: ${id}`);
  }
}
