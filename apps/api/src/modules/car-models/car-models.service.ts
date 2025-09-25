import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { Pagination } from "@api/common/types/common.types";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UUID } from "crypto";
import { slug } from "github-slugger";
import { Repository } from "typeorm";
import { CarManufacturersService } from "../car-manufacturers/car-manufacturers.service";
import { FindAllCarModelsOptions } from "./car-models.types";
import { CreateCarModelDto } from "./dto/create-car-model.dto";
import { UpdateCarModelDto } from "./dto/update-car-model.dto";
import { CarModel } from "./entities/car-model.entity";

@Injectable()
export class CarModelsService {
  private readonly logger = new Logger(CarModelsService.name);

  constructor(
    @InjectRepository(CarModel)
    private modelsRepo: Repository<CarModel>,
    private readonly manufacturersService: CarManufacturersService,
  ) {}

  // region CREATE
  async create(createCarModelDto: CreateCarModelDto): Promise<CarModel> {
    const manufacturer = await this.manufacturersService.findById(
      createCarModelDto.manufacturerId,
    );
    if (!manufacturer) {
      throw new AppError(Errors.CAR_MANUFACTURER_NOT_FOUND);
    }

    const model = this.modelsRepo.create({
      name: createCarModelDto.name,
      slug: slug(createCarModelDto.name),
      manufacturer: manufacturer,
    });

    const existingModel = await this.modelsRepo.findOne({
      where: [{ name: model.name }, { slug: model.slug }],
    });
    if (existingModel) {
      throw new AppError(Errors.CAR_MODEL_ALREADY_EXISTS);
    }

    const savedModel = await this.modelsRepo.save(model);
    this.logger.log(`Created new car model: ${savedModel.name}`);

    return savedModel;
  }

  // region FIND
  async findAll(
    options: FindAllCarModelsOptions,
  ): Promise<Pagination<CarModel>> {
    const { manufacturerId, skip, limit, sortField, sortDirection } = options;

    const queryBuilder = this.modelsRepo
      .createQueryBuilder("carModel")
      .leftJoinAndSelect("carModel.manufacturer", "manufacturer");

    // Apply filters
    if (manufacturerId) {
      queryBuilder.andWhere("carModel.manufacturerId = :manufacturerId", {
        manufacturerId,
      });
    }

    // Apply sorting
    if (sortField && sortDirection) {
      queryBuilder.orderBy(
        `carModel.${sortField}`,
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

  async findById(id: UUID): Promise<CarModel | null> {
    return this.modelsRepo.findOne({
      where: { id },
      relations: {
        manufacturer: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<CarModel | null> {
    return this.modelsRepo.findOne({
      where: { slug },
      relations: {
        manufacturer: true,
      },
    });
  }

  async findByManufacturerId(manufacturerId: UUID): Promise<CarModel[]> {
    return this.modelsRepo.find({
      where: { manufacturer: { id: manufacturerId } },
      relations: ["manufacturer"],
    });
  }

  // region UPDATE
  async update(id: UUID, dto: UpdateCarModelDto): Promise<CarModel> {
    const carModel = await this.findById(id);
    if (!carModel) {
      throw new AppError(Errors.CAR_MODEL_NOT_FOUND);
    }

    const updatedCarModel = this.modelsRepo.create({
      ...carModel,
      ...dto,
    });

    if (dto.manufacturerId) {
      const manufacturer = await this.manufacturersService.findById(
        dto.manufacturerId,
      );
      if (!manufacturer) {
        throw new AppError(Errors.CAR_MANUFACTURER_NOT_FOUND);
      }

      updatedCarModel.manufacturer = manufacturer;
    }

    const saved = await this.modelsRepo.save(updatedCarModel);
    this.logger.log(`Updated car model: ${id}`);

    return saved;
  }

  // region DELETE
  async delete(id: UUID): Promise<void> {
    const carModel = await this.findById(id);
    if (!carModel) {
      throw new AppError(Errors.CAR_MODEL_NOT_FOUND);
    }

    await this.modelsRepo.delete(id);
    this.logger.log(`Deleted car model: ${id}`);
  }
}
