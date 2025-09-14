import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CarManufacturer } from "./entities/car-manufacturer.entity";
import { UUID } from "crypto";

@Injectable()
export class ManufacturersService {
  private readonly logger = new Logger(ManufacturersService.name);

  constructor(
    @InjectRepository(CarManufacturer)
    private manufacturersRepository: Repository<CarManufacturer>,
  ) {}

  async findAll(): Promise<CarManufacturer[]> {
    return this.manufacturersRepository.find({
      relations: ["models"],
    });
  }

  async findById(id: UUID): Promise<CarManufacturer | null> {
    return this.manufacturersRepository.findOne({
      where: { id },
      relations: ["models"],
    });
  }

  async findByName(name: string): Promise<CarManufacturer | null> {
    return this.manufacturersRepository.findOne({
      where: { name },
      relations: ["models"],
    });
  }

  async create(name: string): Promise<CarManufacturer> {
    const manufacturer = this.manufacturersRepository.create({ name });
    const savedManufacturer =
      await this.manufacturersRepository.save(manufacturer);

    this.logger.log(`Created new manufacturer: ${savedManufacturer.name}`);

    return this.findById(savedManufacturer.id) as Promise<CarManufacturer>;
  }

  async update(id: string, name: string): Promise<CarManufacturer | null> {
    await this.manufacturersRepository.update(id, { name });
    this.logger.log(`Updated manufacturer: ${id}`);

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.manufacturersRepository.delete(id);
    this.logger.log(`Deleted manufacturer: ${id}`);
  }
}
