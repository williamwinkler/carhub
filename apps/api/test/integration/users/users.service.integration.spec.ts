import { UsernameAlreadyExistsError } from "@api/common/errors/domain/conflict.error";
import { OnlyAdminsCanUpdateRolesError } from "@api/common/errors/domain/forbidden.error";
import { UserNotFoundError } from "@api/common/errors/domain/not-found.error";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import type { QueryRunner } from "typeorm";
import { DataSource } from "typeorm";
import { User } from "@api/modules/users/entities/user.entity";
import { Car } from "@api/modules/cars/entities/car.entity";
import { CarModel } from "@api/modules/car-models/entities/car-model.entity";
import { CarManufacturer } from "@api/modules/car-manufacturers/entities/car-manufacturer.entity";
import { UsersService } from "@api/modules/users/users.service";
import type { CreateUser, UpdateUser } from "@api/modules/users/users.types";
import { TEST_DATABASE_CONFIG } from "@api/common/test/test-database.config";

// Mock Ctx module for integration tests
jest.mock("@api/common/ctx", () => ({
  Ctx: {
    principalRequired: jest.fn(() => ({ id: randomUUID(), role: "user" })),
  },
}));

/**
 * Transactional Integration Tests for UsersService
 *
 * Each test runs in its own transaction that gets rolled back,
 * ensuring perfect test isolation with no data leakage between tests.
 * This is similar to Elixir's Ecto.SQL.Sandbox pattern.
 */
describe("UsersService Transactional Integration Tests", () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let service: UsersService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(TEST_DATABASE_CONFIG),
        TypeOrmModule.forFeature([User, Car, CarModel, CarManufacturer]),
      ],
      providers: [UsersService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);

    // Ensure database connection is established
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // Start a new transaction for each test
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Create a new service instance that uses the transactional entity manager
    const userRepository = queryRunner.manager.getRepository(User);
    service = new UsersService(userRepository);
  });

  afterEach(async () => {
    // Rollback the transaction - this undoes ALL database changes made during the test
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const userData: CreateUser = {
        firstName: "John",
        lastName: "Doe",
        username: "johndoe_tx",
        hashedPassword: await bcrypt.hash("password123", 12),
      };

      const user = await service.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
      expect(user.username).toBe("johndoe_tx");
      expect(user.role).toBe("user");
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);

      // Verify user exists in this transaction
      const foundUser = await service.findByUsername("johndoe_tx");
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
    });

    it("should throw UsernameAlreadyExistsError when creating user with duplicate username", async () => {
      const userData: CreateUser = {
        firstName: "John",
        lastName: "Doe",
        username: "duplicate_tx",
        hashedPassword: await bcrypt.hash("password123", 12),
      };

      // Create first user
      await service.create(userData);

      // Try to create second user with same username
      const duplicateUserData: CreateUser = {
        firstName: "Jane",
        lastName: "Smith",
        username: "duplicate_tx", // Same username
        hashedPassword: await bcrypt.hash("different_password", 12),
      };

      await expect(service.create(duplicateUserData)).rejects.toThrow(
        UsernameAlreadyExistsError,
      );
    });

    it("should handle case-sensitive usernames correctly", async () => {
      const userData1: CreateUser = {
        firstName: "John",
        lastName: "Doe",
        username: "TestUser_TX",
        hashedPassword: await bcrypt.hash("password123", 12),
      };

      const userData2: CreateUser = {
        firstName: "Jane",
        lastName: "Smith",
        username: "testuser_tx", // Different case
        hashedPassword: await bcrypt.hash("password456", 12),
      };

      const user1 = await service.create(userData1);
      const user2 = await service.create(userData2);

      expect(user1.username).toBe("TestUser_TX");
      expect(user2.username).toBe("testuser_tx");
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe("findByUsername", () => {
    it("should find existing user by username", async () => {
      const userData: CreateUser = {
        firstName: "Alice",
        lastName: "Wonder",
        username: "alice_tx",
        hashedPassword: await bcrypt.hash("wonderland", 12),
      };

      const createdUser = await service.create(userData);
      const foundUser = await service.findByUsername("alice_tx");

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.username).toBe("alice_tx");
    });

    it("should return null for non-existent username", async () => {
      const foundUser = await service.findByUsername("non_existent_tx");
      expect(foundUser).toBeNull();
    });

    it("should not find users created in other test transactions", async () => {
      // This test verifies that transaction isolation is working
      // Any user created in a previous test should not be visible here
      const foundUser = await service.findByUsername("johndoe_tx"); // From previous test
      expect(foundUser).toBeNull();
    });
  });

  describe("update", () => {
    it("should update user successfully", async () => {
      const userData: CreateUser = {
        firstName: "Charlie",
        lastName: "Brown",
        username: "charlie_tx",
        hashedPassword: await bcrypt.hash("peanuts", 12),
      };

      const createdUser = await service.create(userData);

      const updateData: UpdateUser = {
        firstName: "Charles",
        lastName: "Brownson",
      };

      const updatedUser = await service.update(createdUser.id, updateData);

      expect(updatedUser.firstName).toBe("Charles");
      expect(updatedUser.lastName).toBe("Brownson");
      expect(updatedUser.username).toBe("charlie_tx"); // Unchanged
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(
        createdUser.updatedAt.getTime(),
      );
    });

    it("should throw UserNotFoundError when updating non-existent user", async () => {
      const nonExistentId = randomUUID();
      const updateData: UpdateUser = {
        firstName: "Ghost",
      };

      await expect(service.update(nonExistentId, updateData)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it("should throw OnlyAdminsCanUpdateRolesError when non-admin tries to update role", async () => {
      const userData: CreateUser = {
        firstName: "Regular",
        lastName: "User",
        username: "regular_tx",
        hashedPassword: await bcrypt.hash("password", 12),
      };

      const createdUser = await service.create(userData);

      const updateData: UpdateUser = {
        role: "admin",
      };

      await expect(service.update(createdUser.id, updateData)).rejects.toThrow(
        OnlyAdminsCanUpdateRolesError,
      );
    });
  });

  describe("softDelete", () => {
    it("should soft delete user successfully", async () => {
      const userData: CreateUser = {
        firstName: "Delete",
        lastName: "Me",
        username: "delete_tx",
        hashedPassword: await bcrypt.hash("goodbye", 12),
      };

      const createdUser = await service.create(userData);

      await service.softDelete(createdUser.id);

      // User should not be found after soft delete
      const foundUser = await service.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });

    it("should throw UserNotFoundError when soft deleting non-existent user", async () => {
      const nonExistentId = randomUUID();

      await expect(service.softDelete(nonExistentId)).rejects.toThrow(
        UserNotFoundError,
      );
    });
  });

  describe("transaction isolation verification", () => {
    it("should isolate data between tests - create multiple users", async () => {
      // Create multiple users in this transaction
      const users: CreateUser[] = [
        {
          firstName: "User",
          lastName: "One",
          username: "isolation_user1",
          hashedPassword: await bcrypt.hash("pass1", 12),
        },
        {
          firstName: "User",
          lastName: "Two",
          username: "isolation_user2",
          hashedPassword: await bcrypt.hash("pass2", 12),
        },
        {
          firstName: "User",
          lastName: "Three",
          username: "isolation_user3",
          hashedPassword: await bcrypt.hash("pass3", 12),
        },
      ];

      const createdUsers = await Promise.all(
        users.map((userData) => service.create(userData)),
      );

      expect(createdUsers).toHaveLength(3);

      // Verify all users exist in this transaction
      for (const user of createdUsers) {
        const foundUser = await service.findById(user.id);
        expect(foundUser).toBeDefined();
        expect(foundUser?.username).toBe(user.username);
      }

      // These users will be automatically rolled back after this test
    });

    it("should not see users from previous test transaction", async () => {
      // These users from the previous test should not exist due to rollback
      const user1 = await service.findByUsername("isolation_user1");
      const user2 = await service.findByUsername("isolation_user2");
      const user3 = await service.findByUsername("isolation_user3");

      expect(user1).toBeNull();
      expect(user2).toBeNull();
      expect(user3).toBeNull();

      // This proves transaction isolation is working perfectly
    });

    it("should handle PostgreSQL constraint violations within transaction", async () => {
      const userData1: CreateUser = {
        firstName: "Constraint",
        lastName: "Test",
        username: "constraint_isolation_test",
        hashedPassword: await bcrypt.hash("password", 12),
      };

      await service.create(userData1);

      const userData2: CreateUser = {
        firstName: "Duplicate",
        lastName: "User",
        username: "constraint_isolation_test", // Duplicate username
        hashedPassword: await bcrypt.hash("password", 12),
      };

      // This should throw UsernameAlreadyExistsError
      await expect(service.create(userData2)).rejects.toThrow(
        UsernameAlreadyExistsError,
      );

      // Note: After a constraint violation in PostgreSQL, the transaction is in an aborted state
      // We can't continue operations in the same transaction, but that's expected behavior
      // The rollback in afterEach will clean everything up properly
    });
  });

  describe("concurrent transaction simulation", () => {
    it("should handle multiple operations within single transaction", async () => {
      // Simulate multiple operations that would happen in a real request
      const userData: CreateUser = {
        firstName: "Multi",
        lastName: "Op",
        username: "multi_op_tx",
        hashedPassword: await bcrypt.hash("password", 12),
      };

      // Create user
      const createdUser = await service.create(userData);
      expect(createdUser.firstName).toBe("Multi");

      // Update user
      const updatedUser = await service.update(createdUser.id, {
        firstName: "Updated",
        lastName: "Operation",
      });
      expect(updatedUser.firstName).toBe("Updated");

      // Verify changes
      const foundUser = await service.findById(createdUser.id);
      expect(foundUser?.firstName).toBe("Updated");
      expect(foundUser?.lastName).toBe("Operation");

      // All of this will be rolled back after the test
    });
  });
});
