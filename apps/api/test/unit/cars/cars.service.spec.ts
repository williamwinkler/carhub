/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { randomUUID } from "crypto";
import type { MockMetadata } from "jest-mock";
import { ModuleMocker } from "jest-mock";

import { CarsService } from "@api/modules/cars/cars.service";
import { Car } from "@api/modules/cars/entities/car.entity";
import { CarModelsService } from "@api/modules/car-models/car-models.service";
import type { CreateCarDto } from "@api/modules/cars/dto/create-car.dto";
import type { UpdateCarDto } from "@api/modules/cars/dto/update-car.dto";
import {
  CarModelNotFoundError,
  CarNotFoundError,
} from "@api/common/errors/domain/not-found.error";
import { UsersCanOnlyUpdateOwnCarsError } from "@api/common/errors/domain/forbidden.error";
import { createCarFactory } from "../../factories/car.factory";
import * as CtxModule from "@api/common/ctx";

const moduleMocker = new ModuleMocker(global);

// Mock the Ctx module
jest.mock("@api/common/ctx", () => ({
  Ctx: {
    userIdRequired: jest.fn(),
    principalRequired: jest.fn(),
    roleRequired: jest.fn(),
  },
}));

describe("CarsService (Unit)", () => {
  let service: CarsService;
  let carsRepo: jest.Mocked<Repository<Car>>;
  let modelsService: jest.Mocked<CarModelsService>;

  const mockUserId = randomUUID();
  const mockCar = createCarFactory({ createdBy: mockUserId });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarsService],
    })
      .useMocker((token) => {
        if (token === getRepositoryToken(Car)) {
          return {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(),
          };
        }

        if (typeof token === "function") {
          const metadata = moduleMocker.getMetadata(token) as MockMetadata<
            any,
            any
          >;
          const Mock = moduleMocker.generateFromMetadata(metadata);

          return new Mock();
        }
      })
      .compile();

    service = module.get<CarsService>(CarsService);
    carsRepo = module.get(getRepositoryToken(Car));
    modelsService = module.get(
      CarModelsService,
    ) as jest.Mocked<CarModelsService>;

    // Set up common mocks
    (CtxModule.Ctx.userIdRequired as jest.Mock).mockReturnValue(mockUserId);
    (CtxModule.Ctx.principalRequired as jest.Mock).mockReturnValue({
      id: mockUserId,
      role: "user",
    });
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createCarDto: CreateCarDto = {
      modelId: randomUUID(),
      year: 2023,
      color: "Blue",
      kmDriven: 5000,
      price: 25000,
    };

    it("should create a car successfully", async () => {
      const mockModel = {
        id: createCarDto.modelId,
        name: "Camry",
        manufacturer: { id: randomUUID(), name: "Toyota" },
      };
      const createdCar = { ...mockCar, id: randomUUID() };

      modelsService.findById.mockResolvedValue(mockModel as any);
      carsRepo.create.mockReturnValue(createdCar as any);
      carsRepo.save.mockResolvedValue(createdCar as any);

      const result = await service.create(createCarDto);

      expect(modelsService.findById).toHaveBeenCalledWith(createCarDto.modelId);
      expect(carsRepo.create).toHaveBeenCalledWith({
        year: createCarDto.year,
        color: createCarDto.color,
        kmDriven: createCarDto.kmDriven,
        price: createCarDto.price,
        model: mockModel,
        createdBy: mockUserId,
      });
      expect(carsRepo.save).toHaveBeenCalledWith(createdCar);
      expect(result).toBe(createdCar);
    });

    it("should throw CarModelNotFoundError when model does not exist", async () => {
      modelsService.findById.mockResolvedValue(null);

      await expect(service.create(createCarDto)).rejects.toThrow(
        CarModelNotFoundError,
      );
      expect(modelsService.findById).toHaveBeenCalledWith(createCarDto.modelId);
      expect(carsRepo.create).not.toHaveBeenCalled();
      expect(carsRepo.save).not.toHaveBeenCalled();
    });

    it("should use userId from context", async () => {
      const mockModel = {
        id: createCarDto.modelId,
        name: "Camry",
        manufacturer: { id: randomUUID(), name: "Toyota" },
      };
      const createdCar = { ...mockCar, id: randomUUID() };

      modelsService.findById.mockResolvedValue(mockModel as any);
      carsRepo.create.mockReturnValue(createdCar as any);
      carsRepo.save.mockResolvedValue(createdCar as any);

      await service.create(createCarDto);

      expect(CtxModule.Ctx.userIdRequired).toHaveBeenCalled();
      expect(carsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: mockUserId,
        }),
      );
    });
  });

  describe("findById", () => {
    const carId = randomUUID();

    it("should return car when found", async () => {
      carsRepo.findOneBy.mockResolvedValue(mockCar as any);

      const result = await service.findById(carId);

      expect(carsRepo.findOneBy).toHaveBeenCalledWith({ id: carId });
      expect(result).toBe(mockCar);
    });

    it("should return null when car not found", async () => {
      carsRepo.findOneBy.mockResolvedValue(null);

      const result = await service.findById(carId);

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    const carId = randomUUID();
    const updateCarDto: UpdateCarDto = {
      year: 2024,
      color: "Red",
    };

    it("should update car successfully when user owns the car", async () => {
      const existingCar = { ...mockCar, createdBy: mockUserId };
      const createdCar = { ...existingCar, ...updateCarDto };
      const savedCar = { ...createdCar };

      carsRepo.findOneBy.mockResolvedValue(existingCar as any);
      carsRepo.create.mockReturnValue(createdCar as any);
      carsRepo.save.mockResolvedValue(savedCar as any);

      const result = await service.update(carId, updateCarDto);

      expect(carsRepo.findOneBy).toHaveBeenCalledWith({ id: carId });
      expect(carsRepo.create).toHaveBeenCalledWith({
        ...existingCar,
        ...updateCarDto,
      });
      expect(carsRepo.save).toHaveBeenCalledWith(createdCar);
      expect(result).toBe(savedCar);
    });

    it("should throw CarNotFoundError when car does not exist", async () => {
      carsRepo.findOneBy.mockResolvedValue(null);

      await expect(service.update(carId, updateCarDto)).rejects.toThrow(
        CarNotFoundError,
      );
      expect(carsRepo.save).not.toHaveBeenCalled();
    });

    it("should throw UsersCanOnlyUpdateOwnCarsError when user does not own the car", async () => {
      const otherUserId = randomUUID();
      const existingCar = { ...mockCar, createdBy: otherUserId };

      (CtxModule.Ctx.principalRequired as jest.Mock).mockReturnValue({
        id: mockUserId,
        role: "user",
      });
      carsRepo.findOneBy.mockResolvedValue(existingCar as any);

      await expect(service.update(carId, updateCarDto)).rejects.toThrow(
        UsersCanOnlyUpdateOwnCarsError,
      );
      expect(carsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("softDelete", () => {
    const carId = randomUUID();

    it("should soft delete car successfully when user owns the car", async () => {
      const existingCar = { ...mockCar, createdBy: mockUserId };

      carsRepo.findOneBy.mockResolvedValue(existingCar as any);
      carsRepo.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.softDelete(carId);

      expect(carsRepo.findOneBy).toHaveBeenCalledWith({ id: carId });
      expect(carsRepo.softDelete).toHaveBeenCalledWith({ id: carId });
    });

    it("should throw CarNotFoundError when car does not exist", async () => {
      carsRepo.findOneBy.mockResolvedValue(null);

      await expect(service.softDelete(carId)).rejects.toThrow(CarNotFoundError);
      expect(carsRepo.softDelete).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when user does not own the car", async () => {
      const otherUserId = randomUUID();
      const existingCar = { ...mockCar, createdBy: otherUserId };

      (CtxModule.Ctx.principalRequired as jest.Mock).mockReturnValue({
        id: mockUserId,
        role: "user",
      });
      carsRepo.findOneBy.mockResolvedValue(existingCar as any);

      await expect(service.softDelete(carId)).rejects.toThrow(
        "You can only delete your own cars",
      );
      expect(carsRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return paginated cars with default pagination", async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockCar], 1]),
      };

      carsRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll({ skip: 0, limit: 10 });

      expect(result).toEqual({
        items: [mockCar],
        meta: {
          totalItems: 1,
          count: 1,
          skipped: 0,
          limit: 10,
        },
      });
    });

    it("should apply filters correctly", async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      carsRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAll({
        skip: 5,
        limit: 5,
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });
});
