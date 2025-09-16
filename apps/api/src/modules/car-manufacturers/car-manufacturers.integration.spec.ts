import { TEST_DATABASE_CONFIG } from "@api/common/test/test-database.config";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import type { QueryRunner } from "typeorm";
import { DataSource } from "typeorm";
import { ManufacturersService } from "./car-manufacturers.service";
import { CarManufacturer } from "./entities/car-manufacturer.entity";

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
        TypeOrmModule.forFeature([CarManufacturer]),
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
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it("should return all manufacturers when they exist", async () => {
      const manufacturer1 = await service.create("BMW");
      const manufacturer2 = await service.create("Mercedes");

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "BMW" }),
          expect.objectContaining({ name: "Mercedes" }),
        ]),
      );
    });
  });

  describe("findById", () => {
    it("should return null when manufacturer does not exist", async () => {
      const nonExistentId = randomUUID();
      const result = await service.findById(nonExistentId);
      expect(result).toBeNull();
    });

    it("should return manufacturer when it exists", async () => {
      const created = await service.create("Audi");
      const result = await service.findById(created.id);

      expect(result).toMatchObject({
        id: created.id,
        name: "Audi",
      });
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe("create", () => {
    it("should create a new manufacturer successfully", async () => {
      const name = "Tesla";
      const result = await service.create(name);

      expect(result).toMatchObject({
        name: "Tesla",
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify it was persisted
      const found = await service.findById(result.id);
      expect(found).toMatchObject({ name: "Tesla" });
    });

    it("should create multiple manufacturers with different names", async () => {
      const manufacturer1 = await service.create("Ford");
      const manufacturer2 = await service.create("Honda");

      expect(manufacturer1.name).toBe("Ford");
      expect(manufacturer2.name).toBe("Honda");
      expect(manufacturer1.id).not.toBe(manufacturer2.id);

      const all = await service.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("should update manufacturer name successfully", async () => {
      const created = await service.create("Volkswagen");

      // Add a small delay to ensure updatedAt differs
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.update(created.id, "VW");

      expect(result).toMatchObject({
        id: created.id,
        name: "VW",
      });
      expect(result?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );

      // Verify persistence
      const found = await service.findById(created.id);
      expect(found?.name).toBe("VW");
    });

    it("should return null when trying to update non-existent manufacturer", async () => {
      const nonExistentId = randomUUID();
      const result = await service.update(nonExistentId, "Non-existent");
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete manufacturer successfully", async () => {
      const created = await service.create("Peugeot");

      await service.delete(created.id);

      // Verify it's deleted
      const found = await service.findById(created.id);
      expect(found).toBeNull();
    });

    it("should not throw error when deleting non-existent manufacturer", async () => {
      const nonExistentId = randomUUID();

      // Should not throw
      await expect(service.delete(nonExistentId)).resolves.toBeUndefined();
    });

    it("should delete only the specified manufacturer", async () => {
      const manufacturer1 = await service.create("Nissan");
      const manufacturer2 = await service.create("Mazda");

      await service.delete(manufacturer1.id);

      const found1 = await service.findById(manufacturer1.id);
      const found2 = await service.findById(manufacturer2.id);

      expect(found1).toBeNull();
      expect(found2).toMatchObject({ name: "Mazda" });
    });
  });

  describe("data integrity", () => {
    it("should maintain consistent state across multiple operations", async () => {
      // Create
      const bmw = await service.create("BMW");
      const mercedes = await service.create("Mercedes");

      // Update
      const updatedBmw = await service.update(bmw.id, "BMW Group");

      // Verify state
      const all = await service.findAll();
      expect(all).toHaveLength(2);

      const foundBmw = all.find((m) => m.id === bmw.id);
      const foundMercedes = all.find((m) => m.id === mercedes.id);

      expect(foundBmw?.name).toBe("BMW Group");
      expect(foundMercedes?.name).toBe("Mercedes");

      // Delete one
      await service.delete(mercedes.id);

      const afterDelete = await service.findAll();
      expect(afterDelete).toHaveLength(1);
      expect(afterDelete[0].name).toBe("BMW Group");
    });
  });
});
