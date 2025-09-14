/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestError } from "@api/common/errors/domain/bad-request.error";
import { UsernameAlreadyExistsError } from "@api/common/errors/domain/conflict.error";
import { UserNotFoundError } from "@api/common/errors/domain/not-found.error";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "crypto";
import type { MockMetadata } from "jest-mock";
import { ModuleMocker } from "jest-mock";
import type { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import type { CreateUser } from "./users.types";

const moduleMocker = new ModuleMocker(global);

// Mock Ctx module
jest.mock("@api/common/ctx", () => ({
  Ctx: {
    role: "user",
  },
}));

describe("UsersService", () => {
  let service: UsersService;

  const mockUser: User = {
    id: randomUUID(),
    role: "user",
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    password: "hashedPassword123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
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

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findByUsername", () => {
    beforeEach(() => {
      // Mock the internal users array to have test data
      const users = [
        { ...mockUser, username: "testuser" },
        { ...mockUser, username: "admin", role: "admin" as const },
      ];
      (service as any).users = users;
    });

    it("should return user when username exists", async () => {
      const result = await service.findByUsername("testuser");

      expect(result).toBeDefined();
      expect(result?.username).toBe("testuser");
      expect(result?.firstName).toBe("John");
      expect(result?.lastName).toBe("Doe");
    });

    it("should return admin user when admin username is provided", async () => {
      const result = await service.findByUsername("admin");

      expect(result).toBeDefined();
      expect(result?.username).toBe("admin");
      expect(result?.role).toBe("admin");
    });

    it("should return null when username does not exist", async () => {
      const result = await service.findByUsername("nonexistent");

      expect(result).toBeNull();
    });

    it("should return null for empty username", async () => {
      const result = await service.findByUsername("");

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    const testUserId = randomUUID();
    const adminUserId = randomUUID();

    beforeEach(() => {
      const users = [
        { ...mockUser, id: testUserId, username: "testuser" },
        {
          ...mockUser,
          id: adminUserId,
          username: "admin",
          role: "admin" as const,
        },
      ];
      (service as any).users = users;
    });

    it("should return user when ID exists", async () => {
      const result = await service.findById(testUserId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testUserId);
      expect(result?.username).toBe("testuser");
      expect(result?.firstName).toBe("John");
    });

    it("should return admin user when admin ID is provided", async () => {
      const result = await service.findById(adminUserId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(adminUserId);
      expect(result?.role).toBe("admin");
      expect(result?.username).toBe("admin");
    });

    it("should return null when ID does not exist", async () => {
      const nonExistentId = randomUUID();
      const result = await service.findById(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe("getByApiKeyLookupHash", () => {
    const testApiKeyLookupHash = "test_lookup_hash";

    beforeEach(() => {
      const users = [
        {
          ...mockUser,
          username: "testuser",
          apiKeyLookupHash: testApiKeyLookupHash,
          apiKeySecret: "secret123",
        },
        { ...mockUser, username: "admin", role: "admin" as const },
      ];
      (service as any).users = users;
    });

    it("should return user when API key lookup hash matches", async () => {
      const result = await service.findBy(testApiKeyLookupHash);

      expect(result).toBeDefined();
      expect(result?.username).toBe("testuser");
      expect(result?.apiKeyLookupHash).toBe(testApiKeyLookupHash);
    });

    it("should return null for invalid API key lookup hash", async () => {
      const result = await service.findBy("invalid-hash");

      expect(result).toBeNull();
    });
  });

  describe("getAllUsers", () => {
    beforeEach(() => {
      const users = [
        { ...mockUser, username: "testuser1" },
        { ...mockUser, username: "testuser2", role: "admin" as const },
      ];
      (service as any).users = users;
    });

    it("should return all users", async () => {
      const result = await service.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("testuser1");
      expect(result[1].username).toBe("testuser2");
    });

    it("should return a copy of users array", async () => {
      const result = await service.getAllUsers();
      const originalUsers = (service as any).users;

      expect(result).not.toBe(originalUsers);
      expect(result).toEqual(originalUsers);
    });
  });

  describe("create", () => {
    const createUserData: CreateUser = {
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      hashedPassword: "hashedPassword123",
      role: "user",
    };

    beforeEach(() => {
      (service as any).users = [];
    });

    it("should create a new user successfully", async () => {
      const result = await service.create(createUserData, true);

      expect(result).toBeDefined();
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
      expect(result.username).toBe("johndoe");
      expect(result.role).toBe("user");
      expect(result.password).toBe("hashedPassword123");
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should throw error if username already exists", async () => {
      (service as any).users = [mockUser];

      const duplicateUser = { ...createUserData, username: mockUser.username };

      await expect(service.create(duplicateUser, true)).rejects.toThrow(
        UsernameAlreadyExistsError,
      );
    });

    it("should throw error when non-admin tries to create admin", async () => {
      const adminUserData = { ...createUserData, role: "admin" as const };

      await expect(service.create(adminUserData)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe("update", () => {
    const userId = randomUUID();

    beforeEach(() => {
      (service as any).users = [{ ...mockUser, id: userId }];
    });

    it("should update user successfully", async () => {
      const updateData = {
        firstName: "Jane",
        lastName: "Smith",
      };

      const result = await service.update(userId, updateData);

      expect(result.firstName).toBe("Jane");
      expect(result.lastName).toBe("Smith");
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should throw UserNotFoundError when user does not exist", async () => {
      const nonExistentUserId = randomUUID();
      const updateData = { firstName: "Jane" };

      await expect(
        service.update(nonExistentUserId, updateData),
      ).rejects.toThrow(UserNotFoundError);
    });
  });
});
