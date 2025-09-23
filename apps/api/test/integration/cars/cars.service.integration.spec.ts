/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { DataSource, Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { randomUUID } from "crypto";

import { CarsService } from "@api/modules/cars/cars.service";
import { Car } from "@api/modules/cars/entities/car.entity";
import { CarModel } from "@api/modules/car-models/entities/car-model.entity";
import { CarManufacturer } from "@api/modules/car-manufacturers/entities/car-manufacturer.entity";
import { User } from "@api/modules/users/entities/user.entity";
import { CarModelsService } from "@api/modules/car-models/car-models.service";
import { ManufacturersService } from "@api/modules/car-manufacturers/car-manufacturers.service";
import type { CreateCarDto } from "@api/modules/cars/dto/create-car.dto";
import type { UpdateCarDto } from "@api/modules/cars/dto/update-car.dto";
import {
  CarModelNotFoundError,
  CarNotFoundError,
} from "@api/common/errors/domain/not-found.error";
import { UsersCanOnlyUpdateOwnCarsError } from "@api/common/errors/domain/forbidden.error";
import { DatabaseModule } from "@api/modules/database/database.module";
import { ConfigModule } from "@nestjs/config";
import {
  createUserFactory,
  createAdminUserFactory,
} from "../../factories/user.factory";
import { createCarFactory } from "../../factories/car.factory";
import { getTestDataSource } from "../../helpers/database-setup";
import * as CtxModule from "@api/common/ctx";

// Mock the Ctx module
jest.mock("@api/common/ctx", () => ({
  Ctx: {
    userIdRequired: jest.fn(),
    principalRequired: jest.fn(),
    roleRequired: jest.fn(),
  },
}));

describe("CarsService (Integration)", () => {
  let module: TestingModule;
  let service: CarsService;
  let modelsService: CarModelsService;
  let brandsService: ManufacturersService;
  let carsRepo: Repository<Car>;
  let modelsRepo: Repository<CarModel>;
  let brandsRepo: Repository<CarManufacturer>;
  let usersRepo: Repository<User>;
  let dataSource: DataSource;

  let testUser: User;
  let testAdmin: User;
  let testBrand: CarManufacturer;
  let testModel: CarModel;

  beforeAll(async () => {
    dataSource = await getTestDataSource();

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ".env.test",
          isGlobal: true,
        }),
        DatabaseModule,
      ],
      providers: [CarsService, CarModelsService, ManufacturersService],
    }).compile();

    service = module.get<CarsService>(CarsService);
    modelsService = module.get<CarModelsService>(CarModelsService);
    brandsService = module.get<ManufacturersService>(ManufacturersService);
    carsRepo = module.get<Repository<Car>>(getRepositoryToken(Car));
    modelsRepo = module.get<Repository<CarModel>>(getRepositoryToken(CarModel));
    brandsRepo = module.get<Repository<CarManufacturer>>(
      getRepositoryToken(CarManufacturer),
    );
    usersRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Create test data within transaction
    testUser = usersRepo.create(createUserFactory());
    await usersRepo.save(testUser);

    testAdmin = usersRepo.create(createAdminUserFactory());
    await usersRepo.save(testAdmin);

    testBrand = brandsRepo.create({ name: "Toyota" });
    await brandsRepo.save(testBrand);

    testModel = modelsRepo.create({
      name: "Camry",
      manufacturer: testBrand,
    });
    await modelsRepo.save(testModel);

    // Mock context
    (CtxModule.Ctx.userIdRequired as jest.Mock).mockReturnValue(testUser.id);
    (CtxModule.Ctx.principalRequired as jest.Mock).mockReturnValue({
      id: testUser.id,
      role: testUser.role,
      authType: "jwt",
    });
    (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue(testUser.role);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a car with real database persistence", async () => {
      const createCarDto: CreateCarDto = {
        modelId: testModel.id,
        year: 2023,
        color: "Blue",
        kmDriven: 5000,
        price: 25000,
      };

      const result = await service.create(createCarDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.year).toBe(createCarDto.year);
      expect(result.color).toBe(createCarDto.color);
      expect(result.kmDriven).toBe(createCarDto.kmDriven);
      expect(result.price).toBe(createCarDto.price);
      expect(result.createdBy).toBe(testUser.id);

      // Verify it's actually in the database
      const savedCar = await carsRepo.findOne({
        where: { id: result.id },
        relations: ["model", "model.brand"],
      });

      expect(savedCar).toBeDefined();
      expect(savedCar!.model.name).toBe("Camry");
      expect(savedCar!.model.manufacturer.name).toBe("Toyota");
    });

    it("should throw CarModelNotFoundError for non-existent model", async () => {
      const createCarDto: CreateCarDto = {
        modelId: randomUUID(),
        year: 2023,
        color: "Blue",
        kmDriven: 5000,
        price: 25000,
      };

      await expect(service.create(createCarDto)).rejects.toThrow(
        CarModelNotFoundError,
      );
    });
  });

  describe("findById", () => {
    it("should find car with all relations loaded", async () => {
      const car = carsRepo.create(
        createCarFactory({
          ownerId: testUser.id,
        }),
      );
      car.model = testModel;
      const savedCar = await carsRepo.save(car);

      const result = await service.findById(savedCar.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(savedCar.id);
      expect(result!.model).toBeDefined();
      expect(result!.model.manufacturer).toBeDefined();
      expect(result!.model.name).toBe("Camry");
      expect(result!.model.manufacturer.name).toBe("Toyota");
    });

    it("should return null for non-existent car", async () => {
      const result = await service.findById(randomUUID());
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    let testCar: Car;

    beforeEach(async () => {
      testCar = carsRepo.create(
        createCarFactory({
          ownerId: testUser.id,
        }),
      );
      testCar.model = testModel;
      testCar = await carsRepo.save(testCar);
    });

    it("should update car successfully in database", async () => {
      const updateCarDto: UpdateCarDto = {
        year: 2024,
        color: "Red",
        price: 30000,
      };

      const result = await service.update(testCar.id, updateCarDto);

      expect(result.year).toBe(2024);
      expect(result.color).toBe("Red");
      expect(result.price).toBe(30000);

      // Verify in database
      const updatedCar = await carsRepo.findOne({
        where: { id: testCar.id },
      });

      expect(updatedCar!.year).toBe(2024);
      expect(updatedCar!.color).toBe("Red");
      expect(updatedCar!.price).toBe(30000);
    });

    it("should throw CarNotFoundError for non-existent car", async () => {
      const updateCarDto: UpdateCarDto = {
        year: 2024,
      };

      await expect(service.update(randomUUID(), updateCarDto)).rejects.toThrow(
        CarNotFoundError,
      );
    });

    it("should throw UsersCanOnlyUpdateOwnCarsError for other user car", async () => {
      const otherUser = usersRepo.create(createUserFactory());
      await usersRepo.save(otherUser);

      const otherUserCar = carsRepo.create(
        createCarFactory({
          ownerId: otherUser.id,
        }),
      );
      otherUserCar.model = testModel;
      const savedOtherCar = await carsRepo.save(otherUserCar);

      const updateCarDto: UpdateCarDto = {
        year: 2024,
      };

      await expect(
        service.update(savedOtherCar.id, updateCarDto),
      ).rejects.toThrow(UsersCanOnlyUpdateOwnCarsError);
    });
  });

  describe("softDelete", () => {
    let testCar: Car;

    beforeEach(async () => {
      testCar = carsRepo.create(
        createCarFactory({
          ownerId: testUser.id,
        }),
      );
      testCar.model = testModel;
      testCar = await carsRepo.save(testCar);
    });

    it("should soft delete car in database", async () => {
      await service.softDelete(testCar.id);

      // Should not be found in normal query
      const car = await carsRepo.findOne({
        where: { id: testCar.id },
      });
      expect(car).toBeNull();

      // Should be found with withDeleted
      const deletedCar = await carsRepo.findOne({
        where: { id: testCar.id },
        withDeleted: true,
      });
      expect(deletedCar).toBeDefined();
      expect(deletedCar!.deletedAt).toBeDefined();
    });

    it("should throw CarNotFoundError for non-existent car", async () => {
      await expect(service.softDelete(randomUUID())).rejects.toThrow(
        CarNotFoundError,
      );
    });

    it("should throw UsersCanOnlyUpdateOwnCarsError for other user car", async () => {
      const otherUser = usersRepo.create(createUserFactory());
      await usersRepo.save(otherUser);

      const otherUserCar = carsRepo.create(
        createCarFactory({
          ownerId: otherUser.id,
        }),
      );
      otherUserCar.model = testModel;
      const savedOtherCar = await carsRepo.save(otherUserCar);

      await expect(service.softDelete(savedOtherCar.id)).rejects.toThrow(
        UsersCanOnlyUpdateOwnCarsError,
      );
    });
  });

  describe("findAll with database queries", () => {
    beforeEach(async () => {
      // Create multiple cars for pagination testing
      const cars = [
        createCarFactory({ ownerId: testUser.id }),
        createCarFactory({ ownerId: testUser.id, year: 2020 }),
        createCarFactory({ ownerId: testUser.id, year: 2024 }),
      ];

      for (const carData of cars) {
        const car = carsRepo.create(carData);
        car.model = testModel;
        await carsRepo.save(car);
      }
    });

    it("should return paginated results from database", async () => {
      const result = await service.findAll({
        page: 1,
        limit: 2,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it("should filter cars by year range", async () => {
      const result = await service.findAll({
        minYear: 2022,
        maxYear: 2024,
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((car) => {
        expect(car.year).toBeGreaterThanOrEqual(2022);
        expect(car.year).toBeLessThanOrEqual(2024);
      });
    });

    it("should filter cars by brand", async () => {
      const result = await service.findAll({
        brand: "Toyota",
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((car) => {
        expect(car.model.manufacturer.name).toBe("Toyota");
      });
    });
  });
});
