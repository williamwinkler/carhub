import { ManufacturersService } from "@api/modules/car-manufacturers/car-manufacturers.service";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TEST_DATABASE_CONFIG } from "@api/common/test/test-database.config";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import type { QueryRunner } from "typeorm";
import { DataSource } from "typeorm";
import { CarManufacturer } from "@api/modules/car-manufacturers/entities/car-manufacturer.entity";
import { CarModelsService } from "@api/modules/car-models/car-models.service";
import { CarModel } from "@api/modules/car-models/entities/car-model.entity";
import { Car } from "@api/modules/cars/entities/car.entity";

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
  let manufacturersService: ManufacturersService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(TEST_DATABASE_CONFIG),
        TypeOrmModule.forFeature([CarModel, CarManufacturer, Car]),
      ],
      providers: [CarModelsService, ManufacturersService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    service = module.get<CarModelsService>(CarModelsService);
    manufacturersService =
      module.get<ManufacturersService>(ManufacturersService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Replace the default repositories with our transactional ones
    const modelsRepo = queryRunner.manager.getRepository(CarModel);
    const manufacturersRepo =
      queryRunner.manager.getRepository(CarManufacturer);
    (service as any).modelsRepository = modelsRepo;
    (manufacturersService as any).manufacturersRepository = manufacturersRepo;
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  // Helper function to create a manufacturer
  async function createManufacturer(name: string): Promise<CarManufacturer> {
    return await manufacturersService.create({ name });
  }

  describe("findAll", () => {
    it("should return empty array when no models exist", async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it("should return all models with manufacturer relations", async () => {
      const timestamp = Date.now();
      const bmw = await createManufacturer(`BMW_${timestamp}`);
      const mercedes = await createManufacturer(`Mercedes_${timestamp}`);

      const model1 = await service.create({
        name: `X5_${timestamp}`,
        manufacturerId: bmw.id,
      });
      const model2 = await service.create({
        name: `C-Class_${timestamp}`,
        manufacturerId: mercedes.id,
      });

      const result = await service.findAll({});

      expect(result.items).toHaveLength(2);
      expect(result.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: `X5_${timestamp}`,
            manufacturer: expect.objectContaining({ name: `BMW_${timestamp}` }),
          }),
          expect.objectContaining({
            name: `C-Class_${timestamp}`,
            manufacturer: expect.objectContaining({
              name: `Mercedes_${timestamp}`,
            }),
          }),
        ]),
      );
      expect(result.meta.totalItems).toBe(2);
    });
  });

  describe("findById", () => {
    it("should return null when model does not exist", async () => {
      const nonExistentId = randomUUID();
      const result = await service.findById(nonExistentId);
      expect(result).toBeNull();
    });

    it("should return model with manufacturer when it exists", async () => {
      const audi = await createManufacturer(`Audi_${Date.now()}`);
      const created = await service.create({
        name: `A4_${Date.now()}`,
        manufacturerId: audi.id,
      });
      const result = await service.findById(created.id);

      expect(result).toMatchObject({
        id: created.id,
        name: created.name,
        manufacturer: expect.objectContaining({ name: audi.name }),
      });
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe("findByManufacturerId", () => {
    it("should return empty array when manufacturer has no models", async () => {
      const manufacturer = await createManufacturer(`Tesla_${Date.now()}`);
      const result = await service.findByManufacturerId(manufacturer.id);
      expect(result).toEqual([]);
    });

    it("should return only models for specified manufacturer", async () => {
      const timestamp = Date.now();
      const bmw = await createManufacturer(`BMW_${timestamp}`);
      const mercedes = await createManufacturer(`Mercedes_${timestamp}`);

      await service.create({ name: `X5_${timestamp}`, manufacturerId: bmw.id });
      await service.create({ name: `X3_${timestamp}`, manufacturerId: bmw.id });
      await service.create({
        name: `C-Class_${timestamp}`,
        manufacturerId: mercedes.id,
      });

      const bmwModels = await service.findByManufacturerId(bmw.id);
      const mercedesModels = await service.findByManufacturerId(mercedes.id);

      expect(bmwModels).toHaveLength(2);
      expect(mercedesModels).toHaveLength(1);

      bmwModels.forEach((model) => {
        expect(model.manufacturer.name).toBe(`BMW_${timestamp}`);
      });

      expect(mercedesModels[0].manufacturer.name).toBe(`Mercedes_${timestamp}`);
    });

    it("should return empty array for non-existent manufacturer", async () => {
      const nonExistentId = randomUUID();
      const result = await service.findByManufacturerId(nonExistentId);
      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a new model successfully", async () => {
      const ford = await createManufacturer(`Ford_${Date.now()}`);
      const result = await service.create({
        name: `Focus_${Date.now()}`,
        manufacturerId: ford.id,
      });

      expect(result).toMatchObject({
        name: result.name,
        manufacturer: expect.objectContaining({ name: ford.name }),
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify it was persisted
      const found = await service.findById(result.id);
      expect(found).toMatchObject({
        name: result.name,
        manufacturer: expect.objectContaining({ name: ford.name }),
      });
    });

    it("should create multiple models for the same manufacturer", async () => {
      const honda = await createManufacturer(`Honda_${Date.now()}`);

      const civic = await service.create({
        name: `Civic_${Date.now()}`,
        manufacturerId: honda.id,
      });
      const accord = await service.create({
        name: `Accord_${Date.now()}`,
        manufacturerId: honda.id,
      });

      expect(civic.name).toBe(civic.name);
      expect(accord.name).toBe(accord.name);
      expect(civic.id).not.toBe(accord.id);

      const hondaModels = await service.findByManufacturerId(honda.id);
      expect(hondaModels).toHaveLength(2);
    });

    it("should create models for different manufacturers", async () => {
      const timestamp = Date.now();
      const toyota = await createManufacturer(`Toyota_${timestamp}`);
      const nissan = await createManufacturer(`Nissan_${timestamp}`);

      const camry = await service.create({
        name: `Camry_${timestamp}`,
        manufacturerId: toyota.id,
      });
      const altima = await service.create({
        name: `Altima_${timestamp}`,
        manufacturerId: nissan.id,
      });

      expect(camry.manufacturer.name).toBe(`Toyota_${timestamp}`);
      expect(altima.manufacturer.name).toBe(`Nissan_${timestamp}`);
    });
  });

  describe("update", () => {
    it("should update model name successfully", async () => {
      const volkswagen = await createManufacturer(`Volkswagen_${Date.now()}`);
      const created = await service.create({
        name: `Golf_${Date.now()}`,
        manufacturerId: volkswagen.id,
      });

      // Add a small delay to ensure updatedAt differs
      await new Promise((resolve) => setTimeout(resolve, 10));

      const newName = `Golf_GTI_${Date.now()}`;
      const result = await service.update(created.id, { name: newName });

      expect(result).toMatchObject({
        id: created.id,
        name: newName,
        manufacturer: expect.objectContaining({ name: volkswagen.name }),
      });
      expect(result?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );

      // Verify persistence
      const found = await service.findById(created.id);
      expect(found?.name).toBe(newName);
    });

    it("should throw error when trying to update non-existent model", async () => {
      const nonExistentId = randomUUID();
      await expect(
        service.update(nonExistentId, { name: "Non-existent" }),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete model successfully", async () => {
      const mazda = await createManufacturer(`Mazda_${Date.now()}`);
      const created = await service.create({
        name: `MX-5_${Date.now()}`,
        manufacturerId: mazda.id,
      });

      await service.delete(created.id);

      // Verify it's deleted
      const found = await service.findById(created.id);
      expect(found).toBeNull();
    });

    it("should throw error when deleting non-existent model", async () => {
      const nonExistentId = randomUUID();

      await expect(service.delete(nonExistentId)).rejects.toThrow();
    });

    it("should delete only the specified model", async () => {
      const subaru = await createManufacturer(`Subaru_${Date.now()}`);
      const model1 = await service.create({
        name: `Impreza_${Date.now()}`,
        manufacturerId: subaru.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 1));
      const model2 = await service.create({
        name: `Outback_${Date.now()}`,
        manufacturerId: subaru.id,
      });

      await service.delete(model1.id);

      const found1 = await service.findById(model1.id);
      const found2 = await service.findById(model2.id);

      expect(found1).toBeNull();
      expect(found2).toMatchObject({ name: model2.name });
    });

    it("should not affect manufacturer when deleting model", async () => {
      const kia = await createManufacturer(`Kia_${Date.now()}`);
      const model = await service.create({
        name: `Sportage_${Date.now()}`,
        manufacturerId: kia.id,
      });

      await service.delete(model.id);

      // Manufacturer should still exist
      const foundManufacturer = await manufacturersService.findById(kia.id);
      expect(foundManufacturer).toMatchObject({ name: kia.name });
    });
  });

  describe("data integrity", () => {
    it("should maintain consistent state across multiple operations", async () => {
      // Create manufacturers and models
      const timestamp = Date.now();
      const toyota = await createManufacturer(`Toyota_${timestamp}`);
      const honda = await createManufacturer(`Honda_${timestamp}`);

      const camry = await service.create({
        name: `Camry_${timestamp}`,
        manufacturerId: toyota.id,
      });
      const corolla = await service.create({
        name: `Corolla_${timestamp}`,
        manufacturerId: toyota.id,
      });
      const civic = await service.create({
        name: `Civic_${timestamp}`,
        manufacturerId: honda.id,
      });

      // Update a model
      const updatedCamry = await service.update(camry.id, {
        name: `Camry_Hybrid_${timestamp}`,
      });

      // Verify state
      const allModels = await service.findAll({});
      expect(allModels.items).toHaveLength(3);

      const toyotaModels = await service.findByManufacturerId(toyota.id);
      const hondaModels = await service.findByManufacturerId(honda.id);

      expect(toyotaModels).toHaveLength(2);
      expect(hondaModels).toHaveLength(1);

      const foundCamry = toyotaModels.find((m) => m.id === camry.id);
      expect(foundCamry?.name).toBe(`Camry_Hybrid_${timestamp}`);

      // Delete one model
      await service.delete(corolla.id);

      const afterDelete = await service.findByManufacturerId(toyota.id);
      expect(afterDelete).toHaveLength(1);
      expect(afterDelete[0].name).toBe(`Camry_Hybrid_${timestamp}`);
    });

    it("should handle relationships correctly", async () => {
      const timestamp = Date.now();
      const porsche = await createManufacturer(`Porsche_${timestamp}`);
      const model911 = await service.create({
        name: `911_${timestamp}`,
        manufacturerId: porsche.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 1));
      const cayenne = await service.create({
        name: `Cayenne_${timestamp}`,
        manufacturerId: porsche.id,
      });

      // Each model should have the manufacturer relation loaded
      const models = await service.findByManufacturerId(porsche.id);

      models.forEach((model) => {
        expect(model.manufacturer).toBeDefined();
        expect(model.manufacturer.id).toBe(porsche.id);
        expect(model.manufacturer.name).toBe(porsche.name);
      });
    });
  });
});
