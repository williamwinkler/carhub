import { TEST_DATABASE_CONFIG } from "@api/common/test/test-database.config";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import type { QueryRunner } from "typeorm";
import { DataSource } from "typeorm";
import { CarManufacturer } from "../car-manufacturers/entities/car-manufacturer.entity";
import { CarModelsService } from "./car-models.service";
import { CarModel } from "./entities/car-model.entity";

/**
 * Transactional Integration Tests for ModelsService
 *
 * Each test runs in its own transaction that gets rolled back,
 * ensuring perfect test isolation with no data leakage between tests.
 */
describe("ModelsService Transactional Integration Tests", () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let service: CarModelsService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(TEST_DATABASE_CONFIG),
        TypeOrmModule.forFeature([CarModel, CarManufacturer]),
      ],
      providers: [CarModelsService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    service = module.get<CarModelsService>(CarModelsService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Replace the default repository with our transactional one
    const modelsRepo = queryRunner.manager.getRepository(CarModel);
    (service as any).modelsRepository = modelsRepo;
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  // Helper function to create a manufacturer
  async function createManufacturer(name: string): Promise<CarManufacturer> {
    const manufacturersRepo =
      queryRunner.manager.getRepository(CarManufacturer);
    const manufacturer = manufacturersRepo.create({ name });

    return await manufacturersRepo.save(manufacturer);
  }

  describe("findAll", () => {
    it("should return empty array when no models exist", async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it("should return all models with manufacturer relations", async () => {
      const bmw = await createManufacturer("BMW");
      const mercedes = await createManufacturer("Mercedes");

      const model1 = await service.create("X5", bmw.id);
      const model2 = await service.create("C-Class", mercedes.id);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "X5",
            manufacturer: expect.objectContaining({ name: "BMW" }),
          }),
          expect.objectContaining({
            name: "C-Class",
            manufacturer: expect.objectContaining({ name: "Mercedes" }),
          }),
        ]),
      );
    });
  });

  describe("findById", () => {
    it("should return null when model does not exist", async () => {
      const nonExistentId = randomUUID();
      const result = await service.findById(nonExistentId);
      expect(result).toBeNull();
    });

    it("should return model with manufacturer when it exists", async () => {
      const audi = await createManufacturer("Audi");
      const created = await service.create("A4", audi.id);
      const result = await service.findById(created.id);

      expect(result).toMatchObject({
        id: created.id,
        name: "A4",
        manufacturer: expect.objectContaining({ name: "Audi" }),
      });
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe("findByManufacturerId", () => {
    it("should return empty array when manufacturer has no models", async () => {
      const manufacturer = await createManufacturer("Tesla");
      const result = await service.findByManufacturerId(manufacturer.id);
      expect(result).toEqual([]);
    });

    it("should return only models for specified manufacturer", async () => {
      const bmw = await createManufacturer("BMW");
      const mercedes = await createManufacturer("Mercedes");

      await service.create("X5", bmw.id);
      await service.create("X3", bmw.id);
      await service.create("C-Class", mercedes.id);

      const bmwModels = await service.findByManufacturerId(bmw.id);
      const mercedesModels = await service.findByManufacturerId(mercedes.id);

      expect(bmwModels).toHaveLength(2);
      expect(mercedesModels).toHaveLength(1);

      bmwModels.forEach((model) => {
        expect(model.manufacturer.name).toBe("BMW");
      });

      expect(mercedesModels[0].manufacturer.name).toBe("Mercedes");
    });

    it("should return empty array for non-existent manufacturer", async () => {
      const nonExistentId = randomUUID();
      const result = await service.findByManufacturerId(nonExistentId);
      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a new model successfully", async () => {
      const ford = await createManufacturer("Ford");
      const result = await service.create("Focus", ford.id);

      expect(result).toMatchObject({
        name: "Focus",
        manufacturer: expect.objectContaining({ name: "Ford" }),
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify it was persisted
      const found = await service.findById(result.id);
      expect(found).toMatchObject({
        name: "Focus",
        manufacturer: expect.objectContaining({ name: "Ford" }),
      });
    });

    it("should create multiple models for the same manufacturer", async () => {
      const honda = await createManufacturer("Honda");

      const civic = await service.create("Civic", honda.id);
      const accord = await service.create("Accord", honda.id);

      expect(civic.name).toBe("Civic");
      expect(accord.name).toBe("Accord");
      expect(civic.id).not.toBe(accord.id);

      const hondaModels = await service.findByManufacturerId(honda.id);
      expect(hondaModels).toHaveLength(2);
    });

    it("should create models for different manufacturers", async () => {
      const toyota = await createManufacturer("Toyota");
      const nissan = await createManufacturer("Nissan");

      const camry = await service.create("Camry", toyota.id);
      const altima = await service.create("Altima", nissan.id);

      expect(camry.manufacturer.name).toBe("Toyota");
      expect(altima.manufacturer.name).toBe("Nissan");
    });
  });

  describe("update", () => {
    it("should update model name successfully", async () => {
      const volkswagen = await createManufacturer("Volkswagen");
      const created = await service.create("Golf", volkswagen.id);

      // Add a small delay to ensure updatedAt differs
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.update(created.id, "Golf GTI");

      expect(result).toMatchObject({
        id: created.id,
        name: "Golf GTI",
        manufacturer: expect.objectContaining({ name: "Volkswagen" }),
      });
      expect(result?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );

      // Verify persistence
      const found = await service.findById(created.id);
      expect(found?.name).toBe("Golf GTI");
    });

    it("should return null when trying to update non-existent model", async () => {
      const nonExistentId = randomUUID();
      const result = await service.update(nonExistentId, "Non-existent");
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete model successfully", async () => {
      const mazda = await createManufacturer("Mazda");
      const created = await service.create("MX-5", mazda.id);

      await service.delete(created.id);

      // Verify it's deleted
      const found = await service.findById(created.id);
      expect(found).toBeNull();
    });

    it("should not throw error when deleting non-existent model", async () => {
      const nonExistentId = randomUUID();

      // Should not throw
      await expect(service.delete(nonExistentId)).resolves.toBeUndefined();
    });

    it("should delete only the specified model", async () => {
      const subaru = await createManufacturer("Subaru");
      const model1 = await service.create("Impreza", subaru.id);
      const model2 = await service.create("Outback", subaru.id);

      await service.delete(model1.id);

      const found1 = await service.findById(model1.id);
      const found2 = await service.findById(model2.id);

      expect(found1).toBeNull();
      expect(found2).toMatchObject({ name: "Outback" });
    });

    it("should not affect manufacturer when deleting model", async () => {
      const kia = await createManufacturer("Kia");
      const model = await service.create("Sportage", kia.id);

      await service.delete(model.id);

      // Manufacturer should still exist
      const manufacturersRepo =
        queryRunner.manager.getRepository(CarManufacturer);
      const foundManufacturer = await manufacturersRepo.findOne({
        where: { id: kia.id },
      });
      expect(foundManufacturer).toMatchObject({ name: "Kia" });
    });
  });

  describe("data integrity", () => {
    it("should maintain consistent state across multiple operations", async () => {
      // Create manufacturers and models
      const toyota = await createManufacturer("Toyota");
      const honda = await createManufacturer("Honda");

      const camry = await service.create("Camry", toyota.id);
      const corolla = await service.create("Corolla", toyota.id);
      const civic = await service.create("Civic", honda.id);

      // Update a model
      const updatedCamry = await service.update(camry.id, "Camry Hybrid");

      // Verify state
      const allModels = await service.findAll();
      expect(allModels).toHaveLength(3);

      const toyotaModels = await service.findByManufacturerId(toyota.id);
      const hondaModels = await service.findByManufacturerId(honda.id);

      expect(toyotaModels).toHaveLength(2);
      expect(hondaModels).toHaveLength(1);

      const foundCamry = toyotaModels.find((m) => m.id === camry.id);
      expect(foundCamry?.name).toBe("Camry Hybrid");

      // Delete one model
      await service.delete(corolla.id);

      const afterDelete = await service.findByManufacturerId(toyota.id);
      expect(afterDelete).toHaveLength(1);
      expect(afterDelete[0].name).toBe("Camry Hybrid");
    });

    it("should handle relationships correctly", async () => {
      const porsche = await createManufacturer("Porsche");
      const model911 = await service.create("911", porsche.id);
      const cayenne = await service.create("Cayenne", porsche.id);

      // Each model should have the manufacturer relation loaded
      const models = await service.findByManufacturerId(porsche.id);

      models.forEach((model) => {
        expect(model.manufacturer).toBeDefined();
        expect(model.manufacturer.id).toBe(porsche.id);
        expect(model.manufacturer.name).toBe("Porsche");
      });
    });
  });
});
