import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findOne", () => {
    it("should return user when username exists", async () => {
      const result = await service.findOne("string");

      expect(result).toBeDefined();
      expect(result?.username).toBe("string");
      expect(result?.firstName).toBe("William");
      expect(result?.lastName).toBe("Winkler");
    });

    it("should return admin user when admin username is provided", async () => {
      const result = await service.findOne("admin");

      expect(result).toBeDefined();
      expect(result?.username).toBe("admin");
      expect(result?.role).toBe("admin");
      expect(result?.firstName).toBe("Admin");
    });

    it("should return jane user when jane username is provided", async () => {
      const result = await service.findOne("jane");

      expect(result).toBeDefined();
      expect(result?.username).toBe("jane");
      expect(result?.role).toBe("user");
      expect(result?.firstName).toBe("Jane");
      expect(result?.lastName).toBe("Smith");
    });

    it("should return null when username does not exist", async () => {
      const result = await service.findOne("nonexistent");

      expect(result).toBeNull();
    });

    it("should return null for empty username", async () => {
      const result = await service.findOne("");

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return user when ID exists", async () => {
      const williamId = "59fc50ac-30b0-4852-a963-3aa04cdf25d0";
      const result = await service.findById(williamId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(williamId);
      expect(result?.username).toBe("string");
      expect(result?.firstName).toBe("William");
    });

    it("should return admin user when admin ID is provided", async () => {
      const adminId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const result = await service.findById(adminId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(adminId);
      expect(result?.role).toBe("admin");
      expect(result?.username).toBe("admin");
    });

    it("should return jane user when jane ID is provided", async () => {
      const janeId = "b2c3d4e5-f6a7-8901-bcde-f23456789012";
      const result = await service.findById(janeId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(janeId);
      expect(result?.role).toBe("user");
      expect(result?.username).toBe("jane");
      expect(result?.firstName).toBe("Jane");
    });

    it("should return null when ID does not exist", async () => {
      const nonExistentId = "99999999-9999-9999-9999-999999999999";
      const result = await service.findById(nonExistentId);

      expect(result).toBeNull();
    });

    it("should return null for malformed UUID", async () => {
      const result = await service.findById(
        "invalid-uuid" as unknown as `${string}-${string}-${string}-${string}-${string}`,
      );

      expect(result).toBeNull();
    });
  });

  describe("findByApiKey", () => {
    it("should return admin user when admin API key is provided", async () => {
      const result = await service.findByApiKey("admin-api-key");

      expect(result).toBeDefined();
      expect(result?.apiKey).toBe("admin-api-key");
      expect(result?.role).toBe("admin");
      expect(result?.username).toBe("admin");
    });

    it("should return jane user when jane API key is provided", async () => {
      const result = await service.findByApiKey("jane-api-key");

      expect(result).toBeDefined();
      expect(result?.apiKey).toBe("jane-api-key");
      expect(result?.role).toBe("user");
      expect(result?.username).toBe("jane");
    });

    it("should return null for invalid API key", async () => {
      const result = await service.findByApiKey("invalid-api-key");

      expect(result).toBeNull();
    });

    it("should return william user for empty API key since his apiKey is empty", async () => {
      const result = await service.findByApiKey("");

      expect(result).toBeDefined();
      expect(result?.username).toBe("string");
      expect(result?.apiKey).toBe("");
    });

    it("should return william user when searching by empty API key", async () => {
      const result = await service.findByApiKey("");

      expect(result).toBeDefined();
      expect(result?.firstName).toBe("William");
      expect(result?.apiKey).toBe("");
    });
  });

  describe("data integrity", () => {
    it("should have exactly 3 predefined users", async () => {
      const allUsernames = ["string", "admin", "jane"];
      const results = await Promise.all(
        allUsernames.map((username) => service.findOne(username)),
      );

      const foundUsers = results.filter((user) => user !== null);
      expect(foundUsers).toHaveLength(3);
    });

    it("should have users with different roles", async () => {
      const william = await service.findOne("string");
      const admin = await service.findOne("admin");
      const jane = await service.findOne("jane");

      expect(william?.role).toBe("user");
      expect(admin?.role).toBe("admin");
      expect(jane?.role).toBe("user");
    });

    it("should have consistent data between findOne and findById", async () => {
      const userByUsername = await service.findOne("admin");
      const userById = await service.findById(userByUsername!.id);

      expect(userByUsername).toEqual(userById);
    });

    it("should have users with valid UUIDs", async () => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      const william = await service.findOne("string");
      const admin = await service.findOne("admin");
      const jane = await service.findOne("jane");

      expect(william?.id).toMatch(uuidRegex);
      expect(admin?.id).toMatch(uuidRegex);
      expect(jane?.id).toMatch(uuidRegex);
    });
  });
});
