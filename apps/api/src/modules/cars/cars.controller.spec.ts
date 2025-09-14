/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "crypto";
import type { MockMetadata } from "jest-mock";
import { ModuleMocker } from "jest-mock";
import type { Pagination } from "../../common/types/pagination";
import { CarsAdapter } from "./cars.adapter";
import { CarsController } from "./cars.controller";
import { CarsService } from "./cars.service";
import type { CreateCarDto } from "./dto/create-car.dto";
import type { UpdateCarDto } from "./dto/update-car.dto";
import type { Car } from "./entities/car.entity";
import { CarBrand } from "./entities/car.entity";

const moduleMocker = new ModuleMocker(global);

describe("CarsController", () => {
  let controller: CarsController;
  let carsService: jest.Mocked<CarsService>;
  let carsAdapter: jest.Mocked<CarsAdapter>;

  const userId = randomUUID();
  const now = new Date();
  const mockCar: Car = {
    id: randomUUID(),
    brand: CarBrand.BMW,
    model: "X5",
    year: 2023,
    color: "Black",
    kmDriven: 1000,
    price: 50000,
    createdBy: userId,
    createdAt: now,
    updatedBy: userId,
    updatedAt: now,
    favoritedBy: [],
  };

  const mockCarDto = {
    id: mockCar.id,
    brand: mockCar.brand,
    model: mockCar.model,
    year: mockCar.year,
    color: mockCar.color,
    kmDriven: mockCar.kmDriven,
    price: mockCar.price,
    createdBy: mockCar.createdBy,
    createdAt: mockCar.createdAt.toISOString(),
    updatedBy: mockCar.createdBy,
    updatedAt: mockCar.createdAt.toISOString(),
    favoritedBy: mockCar.favoritedBy,
  };

  const mockPaginationResult: Pagination<Car> = {
    items: [mockCar],
    meta: {
      totalItems: 1,
      limit: 20,
      skipped: 0,
      count: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarsController],
    })
      .useMocker((token) => {
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

    controller = module.get<CarsController>(CarsController);
    carsService = module.get(CarsService);
    carsAdapter = module.get(CarsAdapter);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new car successfully", async () => {
      const createCarDto: CreateCarDto = {
        brand: CarBrand.BMW,
        model: "X5",
        year: 2023,
        color: "Black",
        kmDriven: 1000,
        price: 50000,
      };

      carsService.create.mockReturnValue(mockCar);
      carsAdapter.getDto.mockReturnValue(mockCarDto);

      const result = await controller.create(createCarDto);

      expect(carsService.create).toHaveBeenCalledWith(createCarDto);
      expect(carsAdapter.getDto).toHaveBeenCalledWith(mockCar);
      expect(result).toEqual(mockCarDto);
    });
  });

  describe("findAll", () => {
    it("should return paginated list of cars with default parameters", async () => {
      const mockListDto = {
        items: [mockCarDto],
        meta: {
          total: mockPaginationResult.meta.totalItems,
          limit: mockPaginationResult.meta.limit,
          skipped: mockPaginationResult.meta.skipped,
          count: mockPaginationResult.meta.count,
        },
      };

      carsService.findAll.mockReturnValue(mockPaginationResult);
      carsAdapter.getListDto.mockReturnValue(mockListDto);

      const result = await controller.findAll();

      expect(carsService.findAll).toHaveBeenCalledWith({
        brand: undefined,
        model: undefined,
        color: undefined,
        skip: 0,
        limit: 20,
        sortField: undefined,
        sortDirection: undefined,
      });
      expect(carsAdapter.getListDto).toHaveBeenCalledWith(mockPaginationResult);
      expect(result).toEqual(mockListDto);
    });

    it("should return filtered cars with custom parameters", async () => {
      const mockListDto = {
        items: [mockCarDto],
        meta: {
          total: mockPaginationResult.meta.totalItems,
          limit: mockPaginationResult.meta.limit,
          skipped: mockPaginationResult.meta.skipped,
          count: mockPaginationResult.meta.count,
        },
      };

      carsService.findAll.mockReturnValue(mockPaginationResult);
      carsAdapter.getListDto.mockReturnValue(mockListDto);

      const result = await controller.findAll(
        CarBrand.BMW,
        "X5",
        "Black",
        10,
        50,
        "brand",
        "asc",
      );

      expect(carsService.findAll).toHaveBeenCalledWith({
        brand: CarBrand.BMW,
        model: "X5",
        color: "Black",
        skip: 10,
        limit: 50,
        sortField: "brand",
        sortDirection: "asc",
      });
      expect(result).toEqual(mockListDto);
    });
  });

  describe("findOne", () => {
    it("should return a single car by ID", async () => {
      carsService.findById.mockReturnValue(mockCar);
      carsAdapter.getDto.mockReturnValue(mockCarDto);

      const result = await controller.findOne(mockCar.id);

      expect(carsService.findById).toHaveBeenCalledWith(mockCar.id);
      expect(carsAdapter.getDto).toHaveBeenCalledWith(mockCar);
      expect(result).toEqual(mockCarDto);
    });
  });

  describe("update", () => {
    it("should update a car successfully", async () => {
      const updateCarDto: UpdateCarDto = {
        color: "Red",
        price: 55000,
      };
      const updatedCar = { ...mockCar, ...updateCarDto };
      const updatedCarDto = { ...mockCarDto, ...updateCarDto };

      carsService.update.mockReturnValue(updatedCar);
      carsAdapter.getDto.mockReturnValue(updatedCarDto);

      const result = await controller.update(mockCar.id, updateCarDto);

      expect(carsService.update).toHaveBeenCalledWith(mockCar.id, updateCarDto);
      expect(carsAdapter.getDto).toHaveBeenCalledWith(updatedCar);
      expect(result).toEqual(updatedCarDto);
    });
  });

  describe("remove", () => {
    it("should delete a car successfully", async () => {
      carsService.delete.mockReturnValue(undefined);

      await controller.remove(mockCar.id);

      expect(carsService.delete).toHaveBeenCalledWith(mockCar.id);
    });
  });
});
