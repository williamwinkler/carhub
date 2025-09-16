import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UUID } from "crypto";
import { Repository } from "typeorm";
import { CarModel } from "./entities/car-model.entity";

@Injectable()
export class CarModelsService {
  private readonly logger = new Logger(CarModelsService.name);

  constructor(
    @InjectRepository(CarModel)
    private modelsRepository: Repository<CarModel>,
  ) {}

  async findAll(): Promise<CarModel[]> {
    return this.modelsRepository.find({
      relations: ["manufacturer"],
    });
  }

  async findById(id: UUID): Promise<CarModel | null> {
    return this.modelsRepository.findOne({
      where: { id: id },
      relations: {
        manufacturer: true,
      },
    });
  }

  async findByManufacturerId(manufacturerId: UUID): Promise<CarModel[]> {
    return this.modelsRepository.find({
      where: { manufacturer: { id: manufacturerId } },
      relations: ["manufacturer"],
    });
  }

  async create(name: string, manufacturerId: UUID): Promise<CarModel> {
    const model = this.modelsRepository.create({
      name,
      manufacturer: { id: manufacturerId },
    });

    const savedModel = await this.modelsRepository.save(model);
    this.logger.log(`Created new car model: ${savedModel.name}`);

    return this.findById(savedModel.id) as Promise<CarModel>;
  }

  async update(id: UUID, name: string): Promise<CarModel | null> {
    await this.modelsRepository.update(id, { name });
    this.logger.log(`Updated car model: ${id}`);

    return this.findById(id);
  }

  async delete(id: UUID): Promise<void> {
    await this.modelsRepository.delete(id);
    this.logger.log(`Deleted car model: ${id}`);
  }
}
