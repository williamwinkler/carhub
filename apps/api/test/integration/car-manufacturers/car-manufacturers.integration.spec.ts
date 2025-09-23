/* eslint-disable @typescript-eslint/no-explicit-any */
import { TEST_DATABASE_CONFIG } from "@api/common/test/test-database.config";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import type { QueryRunner } from "typeorm";
import { DataSource } from "typeorm";
import { ManufacturersService } from "@api/modules/car-manufacturers/car-manufacturers.service";
import { CarManufacturer } from "@api/modules/car-manufacturers/entities/car-manufacturer.entity";
import { CarModel } from "@api/modules/car-models/entities/car-model.entity";
import { Car } from "@api/modules/cars/entities/car.entity";

/**
 * Transactional Integration Tests for ManufacturersService
 *
 * Each test runs in its own transaction that gets rolled back,
 * ensuring perfect test isolation with no data leakage between tests.
 */
describe("ManufacturersService Transactional Integration Tests", () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let service: ManufacturersService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(TEST_DATABASE_CONFIG),
        TypeOrmModule.forFeature([CarManufacturer, CarModel, Car]),
      ],
      providers: [ManufacturersService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    service = module.get<ManufacturersService>(ManufacturersService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Replace the default repository with our transactional one
    const manufacturersRepo =
      queryRunner.manager.getRepository(CarManufacturer);
    (service as any).manufacturersRepository = manufacturersRepo;
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  describe("findAll", () => {
    it("should return empty array when no manufacturers exist", async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it("should return all manufacturers when they exist", async () => {
      const timestamp = Date.now();
      const manufacturer1 = await service.create({ name: `BMW_${timestamp}` });
      const manufacturer2 = await service.create({
        name: `Mercedes_${timestamp}`,
      });

      const result = await service.findAll({});

      expect(result.items).toHaveLength(2);
      expect(result.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: `BMW_${timestamp}` }),
          expect.objectContaining({ name: `Mercedes_${timestamp}` }),
        ]),
      );
      expect(result.meta.totalItems).toBe(2);
    });
  });

  describe("findById", () => {
    it("should return null when manufacturer does not exist", async () => {
      const nonExistentId = randomUUID();
      const result = await service.findById(nonExistentId);
      expect(result).toBeNull();
    });

    it("should return manufacturer when it exists", async () => {
      const created = await service.create({ name: `Audi_${Date.now()}` });
      const result = await service.findById(created.id);

      expect(result).toMatchObject({
        id: created.id,
        name: created.name,
      });
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe("create", () => {
    it("should create a new manufacturer successfully", async () => {
      const name = `Tesla_${Date.now()}`;
      const result = await service.create({ name });

      expect(result).toMatchObject({
        name,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify it was persisted
      const found = await service.findById(result.id);
      expect(found).toMatchObject({ name });
    });

    it("should create multiple manufacturers with different names", async () => {
      const timestamp = Date.now();
      const manufacturer1 = await service.create({ name: `Ford_${timestamp}` });
      const manufacturer2 = await service.create({
        name: `Honda_${timestamp}`,
      });

      expect(manufacturer1.name).toBe(`Ford_${timestamp}`);
      expect(manufacturer2.name).toBe(`Honda_${timestamp}`);
      expect(manufacturer1.id).not.toBe(manufacturer2.id);

      const all = await service.findAll({});
      expect(all.items).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("should update manufacturer name successfully", async () => {
      const created = await service.create({
        name: `Volkswagen_${Date.now()}`,
      });

      // Add a small delay to ensure updatedAt differs
      await new Promise((resolve) => setTimeout(resolve, 10));

      const newName = `VW_${Date.now()}`;
      const result = await service.update(created.id, { name: newName });

      expect(result).toMatchObject({
        id: created.id,
        name: newName,
      });
      expect(result?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );

      // Verify persistence
      const found = await service.findById(created.id);
      expect(found?.name).toBe(newName);
    });

    it("should throw error when trying to update non-existent manufacturer", async () => {
      const nonExistentId = randomUUID();
      await expect(
        service.update(nonExistentId, { name: "Non-existent" }),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete manufacturer successfully", async () => {
      const created = await service.create({ name: `Peugeot_${Date.now()}` });

      await service.delete(created.id);

      // Verify it's deleted
      const found = await service.findById(created.id);
      expect(found).toBeNull();
    });

    it("should throw error when deleting non-existent manufacturer", async () => {
      const nonExistentId = randomUUID();

      await expect(service.delete(nonExistentId)).rejects.toThrow();
    });

    it("should delete only the specified manufacturer", async () => {
      const timestamp = Date.now();
      const manufacturer1 = await service.create({
        name: `Nissan_${timestamp}`,
      });
      const manufacturer2 = await service.create({
        name: `Mazda_${timestamp}`,
      });

      await service.delete(manufacturer1.id);

      const found1 = await service.findById(manufacturer1.id);
      const found2 = await service.findById(manufacturer2.id);

      expect(found1).toBeNull();
      expect(found2).toMatchObject({ name: `Mazda_${timestamp}` });
    });
  });

  describe("data integrity", () => {
    it("should maintain consistent state across multiple operations", async () => {
      // Create
      const timestamp = Date.now();
      const bmw = await service.create({ name: `BMW_${timestamp}` });
      const mercedes = await service.create({ name: `Mercedes_${timestamp}` });

      // Update
      const newBmwName = `BMW_Group_${timestamp}`;
      const updatedBmw = await service.update(bmw.id, { name: newBmwName });

      // Verify state
      const all = await service.findAll({});
      expect(all.items).toHaveLength(2);

      const foundBmw = all.items.find((m) => m.id === bmw.id);
      const foundMercedes = all.items.find((m) => m.id === mercedes.id);

      expect(foundBmw?.name).toBe(newBmwName);
      expect(foundMercedes?.name).toBe(`Mercedes_${timestamp}`);

      // Delete one
      await service.delete(mercedes.id);

      const afterDelete = await service.findAll({});
      expect(afterDelete.items).toHaveLength(1);
      expect(afterDelete.items[0].name).toBe(newBmwName);
    });
  });
});
