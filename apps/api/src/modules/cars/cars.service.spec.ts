import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";

import type { UUID } from "crypto";
import { randomUUID } from "crypto";
import { BadRequestError } from "../../common/errors/domain/bad-request.error";
import { CarNotFoundError } from "../../common/errors/domain/not-found.error";
import { CarsService } from "./cars.service";
import type { CreateCarDto } from "./dto/create-car.dto";
import type { UpdateCarDto } from "./dto/update-car.dto";
import { CarBrand } from "./entities/car.entity";

describe("CarsService", () => {
  let service: CarsService;
  let cleanService: CarsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarsService],
    }).compile();

    service = module.get<CarsService>(CarsService);

    // Create a clean instance for filtering tests by clearing the cars Map
    cleanService = new CarsService();
    // Clear seeded data
    (cleanService as unknown as { cars: Map<string, unknown> }).cars.clear();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new car successfully", () => {
      const createCarDto: CreateCarDto = {
        brand: CarBrand.BMW,
        model: "X5",
        year: 2023,
        color: "Black",
        kmDriven: 1000,
        price: 50000,
      };
      const createdBy = randomUUID() as UUID;

      const result = cleanService.create(createCarDto, createdBy);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.brand).toBe(CarBrand.BMW);
      expect(result.model).toBe("X5");
      expect(result.year).toBe(2023);
      expect(result.color).toBe("Black");
      expect(result.kmDriven).toBe(1000);
      expect(result.price).toBe(50000);
      expect(result.createdBy).toBe(createdBy);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.favoritedBy).toEqual([]);
    });

    it("should create cars with different brands", () => {
      const createCarDto: CreateCarDto = {
        brand: CarBrand.Tesla,
        model: "Model S",
        year: 2024,
        color: "White",
        kmDriven: 0,
        price: 80000,
      };
      const createdBy = randomUUID() as UUID;

      const result = cleanService.create(createCarDto, createdBy);

      expect(result.brand).toBe(CarBrand.Tesla);
      expect(result.model).toBe("Model S");
    });
  });

  describe("findAll", () => {
    beforeEach(() => {
      // Create some test cars in clean service
      const testCars = [
        {
          brand: CarBrand.BMW,
          model: "X5",
          year: 2023,
          color: "Black",
          kmDriven: 1000,
          price: 50000,
        },
        {
          brand: CarBrand.Tesla,
          model: "Model S",
          year: 2024,
          color: "White",
          kmDriven: 500,
          price: 80000,
        },
        {
          brand: CarBrand.BMW,
          model: "M3",
          year: 2022,
          color: "Red",
          kmDriven: 2000,
          price: 45000,
        },
      ];

      const createdBy = randomUUID() as UUID;
      testCars.forEach((carData) => {
        cleanService.create(carData, createdBy);
      });
    });

    it("should return all cars when no filters applied", () => {
      const result = cleanService.findAll({
        skip: 0,
        limit: 10,
        sortField: "brand",
        sortDirection: "desc",
      });

      expect(result.items.length).toBe(3);
      expect(result.meta.totalItems).toBe(3);
    });

    it("should filter cars by brand", () => {
      const result = cleanService.findAll({
        brand: CarBrand.BMW,
        skip: 0,
        limit: 10,
        sortField: "brand",
        sortDirection: "desc",
      });

      expect(result.items.length).toBe(2);
      result.items.forEach((car) => {
        expect(car.brand).toBe(CarBrand.BMW);
      });
    });

    it("should filter cars by model", () => {
      const result = cleanService.findAll({
        model: "X5",
        skip: 0,
        limit: 10,
        sortField: "brand",
        sortDirection: "desc",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].model).toBe("X5");
    });

    it("should filter cars by color", () => {
      const result = cleanService.findAll({
        color: "Black",
        skip: 0,
        limit: 10,
        sortField: "brand",
        sortDirection: "desc",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].color).toBe("Black");
    });

    it("should apply pagination correctly", () => {
      const result = cleanService.findAll({
        skip: 0,
        limit: 2,
        sortField: "brand",
        sortDirection: "desc",
      });

      expect(result.items.length).toBe(2);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.skipped).toBe(0);
    });

    it("should sort cars by price ascending", () => {
      const result = cleanService.findAll({
        skip: 0,
        limit: 10,
        sortField: "price",
        sortDirection: "asc",
      });

      const prices = result.items.map((car) => car.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it("should sort cars by price descending", () => {
      const result = cleanService.findAll({
        skip: 0,
        limit: 10,
        sortField: "price",
        sortDirection: "desc",
      });

      const prices = result.items.map((car) => car.price);
      const sortedPrices = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sortedPrices);
    });

    it("should handle multiple filters", () => {
      const result = cleanService.findAll({
        brand: CarBrand.BMW,
        color: "Black",
        skip: 0,
        limit: 10,
        sortField: "brand",
        sortDirection: "desc",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].brand).toBe(CarBrand.BMW);
      expect(result.items[0].color).toBe("Black");
    });
  });

  describe("findById", () => {
    it("should return car when ID exists", () => {
      const createCarDto: CreateCarDto = {
        brand: CarBrand.Tesla,
        model: "Model 3",
        year: 2023,
        color: "Blue",
        kmDriven: 0,
        price: 40000,
      };
      const createdBy = randomUUID() as UUID;
      const createdCar = cleanService.create(createCarDto, createdBy);

      const result = cleanService.findById(createdCar.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdCar.id);
      expect(result.model).toBe("Model 3");
    });

    it("should throw CarNotFoundError when car does not exist", () => {
      const nonExistentId = randomUUID() as UUID;

      expect(() => cleanService.findById(nonExistentId)).toThrow(
        CarNotFoundError,
      );
    });
  });

  describe("update", () => {
    let testCar: ReturnType<CarsService["create"]>;
    let createdBy: UUID;

    beforeEach(() => {
      const createCarDto: CreateCarDto = {
        brand: CarBrand.Honda,
        model: "Civic",
        year: 2020,
        color: "Silver",
        kmDriven: 5000,
        price: 25000,
      };
      createdBy = randomUUID() as UUID;
      testCar = cleanService.create(createCarDto, createdBy);
    });

    it("should update car successfully when user is owner", () => {
      const updateDto: UpdateCarDto = {
        color: "Red",
        price: 26000,
      };

      const result = cleanService.update(
        testCar.id,
        updateDto,
        createdBy,
        "user",
      );

      expect(result.color).toBe("Red");
      expect(result.price).toBe(26000);
      expect(result.updatedBy).toBe(createdBy);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should allow admin to update any car", () => {
      const adminUserId = randomUUID() as UUID;
      const updateDto: UpdateCarDto = {
        model: "Civic Si",
      };

      const result = cleanService.update(
        testCar.id,
        updateDto,
        adminUserId,
        "admin",
      );

      expect(result.model).toBe("Civic Si");
      expect(result.updatedBy).toBe(adminUserId);
    });

    it("should throw BadRequestError when non-owner user tries to update", () => {
      const otherUserId = randomUUID() as UUID;
      const updateDto: UpdateCarDto = {
        color: "Blue",
      };

      expect(() =>
        cleanService.update(testCar.id, updateDto, otherUserId, "user"),
      ).toThrow(BadRequestError);
    });

    it("should throw CarNotFoundError when car does not exist", () => {
      const nonExistentId = randomUUID() as UUID;
      const updateDto: UpdateCarDto = {
        color: "Green",
      };

      expect(() =>
        cleanService.update(nonExistentId, updateDto, createdBy, "user"),
      ).toThrow(CarNotFoundError);
    });
  });

  describe("remove", () => {
    let testCar: ReturnType<CarsService["create"]>;
    let createdBy: UUID;

    beforeEach(() => {
      const createCarDto: CreateCarDto = {
        brand: CarBrand.Ford,
        model: "Focus",
        year: 2019,
        color: "Blue",
        kmDriven: 8000,
        price: 18000,
      };
      createdBy = randomUUID() as UUID;
      testCar = cleanService.create(createCarDto, createdBy);
    });

    it("should remove car successfully when user is owner", () => {
      expect(() =>
        cleanService.remove(testCar.id, createdBy, "user"),
      ).not.toThrow();

      expect(() => cleanService.findById(testCar.id)).toThrow(CarNotFoundError);
    });

    it("should allow admin to remove any car", () => {
      const adminUserId = randomUUID() as UUID;

      expect(() =>
        cleanService.remove(testCar.id, adminUserId, "admin"),
      ).not.toThrow();

      expect(() => cleanService.findById(testCar.id)).toThrow(CarNotFoundError);
    });

    it("should throw BadRequestError when non-owner user tries to remove", () => {
      const otherUserId = randomUUID() as UUID;

      expect(() =>
        cleanService.remove(testCar.id, otherUserId, "user"),
      ).toThrow(BadRequestError);
    });

    it("should throw CarNotFoundError when car does not exist", () => {
      const nonExistentId = randomUUID() as UUID;

      expect(() =>
        cleanService.remove(nonExistentId, createdBy, "user"),
      ).toThrow(CarNotFoundError);
    });
  });

  describe("toggleFavorite", () => {
    let testCar: ReturnType<CarsService["create"]>;
    let userId: UUID;

    beforeEach(() => {
      const createCarDto: CreateCarDto = {
        brand: CarBrand.Audi,
        model: "A4",
        year: 2021,
        color: "White",
        kmDriven: 3000,
        price: 35000,
      };
      const createdBy = randomUUID() as UUID;
      testCar = cleanService.create(createCarDto, createdBy);
      userId = randomUUID() as UUID;
    });

    it("should add user to favorites when not already favorited", () => {
      const result = cleanService.toggleFavorite(testCar.id, userId);

      expect(result.favoritedBy).toContain(userId);
      expect(result.favoritedBy.length).toBe(1);
    });

    it("should remove user from favorites when already favorited", () => {
      cleanService.toggleFavorite(testCar.id, userId);
      const result = cleanService.toggleFavorite(testCar.id, userId);

      expect(result.favoritedBy).not.toContain(userId);
      expect(result.favoritedBy.length).toBe(0);
    });

    it("should handle multiple users favoriting the same car", () => {
      const user2Id = randomUUID() as UUID;

      cleanService.toggleFavorite(testCar.id, userId);
      cleanService.toggleFavorite(testCar.id, user2Id);

      const result = cleanService.findById(testCar.id);
      expect(result.favoritedBy).toContain(userId);
      expect(result.favoritedBy).toContain(user2Id);
      expect(result.favoritedBy.length).toBe(2);
    });

    it("should throw CarNotFoundError when car does not exist", () => {
      const nonExistentId = randomUUID() as UUID;

      expect(() => cleanService.toggleFavorite(nonExistentId, userId)).toThrow(
        CarNotFoundError,
      );
    });
  });

  describe("getFavoritesByUser", () => {
    let userId: UUID;

    beforeEach(() => {
      userId = randomUUID() as UUID;
      const createdBy = randomUUID() as UUID;

      // Create multiple cars
      const cars = [
        {
          brand: CarBrand.Mercedes,
          model: "C-Class",
          year: 2022,
          color: "Black",
          kmDriven: 1500,
          price: 45000,
        },
        {
          brand: CarBrand.Porsche,
          model: "911",
          year: 2023,
          color: "Red",
          kmDriven: 500,
          price: 120000,
        },
        {
          brand: CarBrand.Volkswagen,
          model: "Golf",
          year: 2021,
          color: "White",
          kmDriven: 4000,
          price: 22000,
        },
      ];

      cars.forEach((carData) => {
        const car = cleanService.create(carData, createdBy);
        if (carData.brand !== CarBrand.Volkswagen) {
          cleanService.toggleFavorite(car.id, userId);
        }
      });
    });

    it("should return all cars favorited by user", () => {
      const result = cleanService.getFavoritesByUser(userId);

      expect(result.length).toBe(2);
      expect(result.every((car) => car.favoritedBy.includes(userId))).toBe(
        true,
      );
    });

    it("should return empty array when user has no favorites", () => {
      const nonFavoritingUserId = randomUUID() as UUID;
      const result = cleanService.getFavoritesByUser(nonFavoritingUserId);

      expect(result).toEqual([]);
    });

    it("should return only cars favorited by specific user", () => {
      const user2Id = randomUUID() as UUID;
      const createCarDto: CreateCarDto = {
        brand: CarBrand.Toyota,
        model: "Prius",
        year: 2020,
        color: "Green",
        kmDriven: 6000,
        price: 28000,
      };

      const newCar = cleanService.create(createCarDto, randomUUID() as UUID);
      cleanService.toggleFavorite(newCar.id, user2Id);

      const user1Favorites = cleanService.getFavoritesByUser(userId);
      const user2Favorites = cleanService.getFavoritesByUser(user2Id);

      expect(user1Favorites.length).toBe(2);
      expect(user2Favorites.length).toBe(1);
      expect(user2Favorites[0].id).toBe(newCar.id);
    });
  });

  describe("seeded data", () => {
    it("should have seeded cars available on initialization", () => {
      const result = service.findAll({
        skip: 0,
        limit: 100,
        sortField: "brand",
        sortDirection: "asc",
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.meta.totalItems).toBeGreaterThan(0);
    });

    it("should have cars with system user as creator", () => {
      const result = service.findAll({
        skip: 0,
        limit: 100,
        sortField: "brand",
        sortDirection: "asc",
      });

      const seededCars = result.items.filter(
        (car) => car.createdBy === "00000000-0000-0000-0000-000000000000",
      );

      expect(seededCars.length).toBeGreaterThan(0);
    });
  });
});
