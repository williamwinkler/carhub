/* eslint-disable @typescript-eslint/no-explicit-any */
import * as CtxModule from "@api/common/ctx";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { JwtService } from "@nestjs/jwt";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { Cache } from "cache-manager";
import { randomUUID } from "crypto";
import type { MockMetadata } from "jest-mock";
import { ModuleMocker } from "jest-mock";
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../../common/errors/domain/bad-request.error";
import { UnauthorizedError } from "../../common/errors/domain/unauthorized.error";
import { ConfigService } from "../config/config.service";
import type { RoleType, User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import type { TokenPayload } from "./auth.service";
import { AuthService } from "./auth.service";

const moduleMocker = new ModuleMocker(global);

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let cacheManager: jest.Mocked<Cache>;

  const mockUser: User = {
    id: randomUUID(),
    role: "user" as RoleType,
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    password: "password123",
    apiKeyLookupHash: "test-lookup-hash",
    apiKeySecret: "test-api-secret",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokenPayload: TokenPayload = {
    iss: "Demo Nestjs API",
    sub: mockUser.id,
    sid: randomUUID(),
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: mockUser.role,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    })
      .useMocker((token) => {
        // Auto‑mock all classes
        if (typeof token === "function") {
          const metadata = moduleMocker.getMetadata(token) as MockMetadata<
            any,
            any
          >;
          const Mock = moduleMocker.generateFromMetadata(metadata);

          return new Mock();
        }

        // Special‑case constants like CACHE_MANAGER
        if (token === CACHE_MANAGER) {
          return {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          };
        }
      })
      .compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("verifyAccessToken", () => {
    it("should verify and return token payload", async () => {
      jwtService.verifyAsync.mockResolvedValue(mockTokenPayload);

      const result = await service.verifyAccessToken("valid-token");

      expect(result).toEqual(mockTokenPayload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith("valid-token");
    });

    it("should throw UnauthorizedError for invalid token", async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error("Invalid token"));

      try {
        await service.verifyAccessToken("invalid-token");
        fail("Expected UnauthorizedError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedError);
        expect((error as UnauthorizedError).message).toBe(
          "Invalid or missing authentication credentials",
        );
      }
    });
  });

  describe("findUserByApiKey", () => {
    it("should return user from cache when available", async () => {
      cacheManager.get.mockResolvedValue(mockUser);

      const result = await service.findUserByApiKey("valid-api-key");

      expect(result).toEqual(mockUser);
      expect(cacheManager.get).toHaveBeenCalled();
      expect(usersService.findBy).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError when user not found", async () => {
      cacheManager.get.mockResolvedValue(null);
      usersService.findBy.mockResolvedValue(null);

      await expect(service.findUserByApiKey("invalid-api-key")).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe("login", () => {
    it("should throw InvalidCredentialsError for non-existent user", async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(service.login("nonexistent", "password")).rejects.toThrow(
        InvalidCredentialsError,
      );
    });

    it("should throw InvalidCredentialsError for user without password", async () => {
      const userWithoutPassword = { ...mockUser, password: "" };

      usersService.findByUsername.mockResolvedValue(userWithoutPassword);

      await expect(service.login("johndoe", "password123")).rejects.toThrow(
        InvalidCredentialsError,
      );
    });
  });

  describe("principalFromJwt", () => {
    it("should create principal from JWT payload", () => {
      const result = service.principalFromJwt(mockTokenPayload);

      expect(result).toEqual({
        id: mockTokenPayload.sub,
        role: mockTokenPayload.role,
        sessionId: mockTokenPayload.sid,
        authType: "jwt",
      });
    });
  });

  describe("principalFromUser", () => {
    it("should create principal from user", () => {
      const result = service.principalFromUser(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        role: mockUser.role,
        authType: "api-key",
      });
    });
  });

  describe("refreshTokens", () => {
    const refreshTokenPayload = {
      sub: mockUser.id,
      sid: mockTokenPayload.sid,
    };

    it("should refresh tokens successfully", async () => {
      const refreshToken = "valid-refresh-token";
      const expectedTokens = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      jwtService.verifyAsync.mockResolvedValue(refreshTokenPayload);
      configService.get.mockReturnValue("refresh-secret");
      cacheManager.get.mockResolvedValue(refreshToken);
      usersService.findById.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce("new-access-token")
        .mockResolvedValueOnce("new-refresh-token");
      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.del.mockResolvedValue(true);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toEqual(expectedTokens);
      expect(cacheManager.del).toHaveBeenCalledWith(
        `refresh_tokens:${mockUser.id}:${refreshTokenPayload.sid}`,
      );
    });

    it("should throw InvalidRefreshTokenError for invalid signature", async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error("Invalid signature"));

      await expect(service.refreshTokens("invalid-token")).rejects.toThrow();
    });

    it("should throw InvalidRefreshTokenError for revoked token", async () => {
      jwtService.verifyAsync.mockResolvedValue(refreshTokenPayload);
      configService.get.mockReturnValue("refresh-secret");
      cacheManager.get.mockResolvedValue(null);

      await expect(service.refreshTokens("revoked-token")).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });

    it("should throw InvalidRefreshTokenError for non-existent user", async () => {
      const refreshToken = "valid-refresh-token";

      jwtService.verifyAsync.mockResolvedValue(refreshTokenPayload);
      configService.get.mockReturnValue("refresh-secret");
      cacheManager.get.mockResolvedValue(refreshToken);
      usersService.findById.mockResolvedValue(null);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });
  });

  describe("register", () => {
    it("should register user successfully", async () => {
      const registerDto = {
        firstName: "Jane",
        lastName: "Smith",
        username: "janesmith",
        password: "password123",
        role: "user" as RoleType,
      };

      const expectedUser = { ...mockUser, ...registerDto };
      usersService.create.mockResolvedValue(expectedUser);

      const result = await service.register(registerDto);

      expect(result).toEqual(expectedUser);
      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        hashedPassword: expect.any(String),
      });
    });

    it("should throw ConflictError for duplicate username", async () => {
      const registerDto = {
        firstName: "Jane",
        lastName: "Smith",
        username: "johndoe", // existing username
        password: "password123",
        role: "user" as RoleType,
      };

      const conflictError = new Error("Username already exists");
      usersService.create.mockRejectedValue(conflictError);

      await expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe("createApiKey", () => {
    beforeEach(() => {
      // Mock Ctx for createApiKey tests
      (CtxModule as any).Ctx = {
        role: "user",
        userIdRequired: jest.fn().mockReturnValue(mockUser.id),
      };
    });

    it("should create API key successfully", async () => {
      configService.get.mockReturnValue("test");
      usersService.update.mockResolvedValue(mockUser);

      const result = await service.createApiKey();

      expect(result).toMatch(/^ak_test_[a-f0-9]{64}$/);
      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          apiKeyLookupHash: expect.any(String),
          apiKeySecret: expect.any(String),
        }),
      );
    });

    it("should create API key for specific user when admin", async () => {
      const targetUserId = randomUUID();
      (CtxModule as any).Ctx.role = "admin";

      configService.get.mockReturnValue("test");
      usersService.update.mockResolvedValue(mockUser);

      const result = await service.createApiKey(targetUserId);

      expect(result).toMatch(/^ak_test_[a-f0-9]{64}$/);
      expect(usersService.update).toHaveBeenCalledWith(
        targetUserId,
        expect.any(Object),
      );
    });

    it("should throw BadRequestError when non-admin tries to create key for another user", async () => {
      const targetUserId = randomUUID();
      (CtxModule as any).Ctx.role = "user";

      await expect(service.createApiKey(targetUserId)).rejects.toThrow(
        "Only admins can create apiKeys on behalf of other users",
      );
    });

    it("should throw InternalServerError after 3 failed attempts", async () => {
      configService.get.mockReturnValue("test");
      usersService.update.mockRejectedValue(new Error("Constraint error"));

      await expect(service.createApiKey()).rejects.toThrow();
    });

    it("should retry on constraint errors and eventually succeed", async () => {
      configService.get.mockReturnValue("test");
      usersService.update
        .mockRejectedValueOnce(new Error("Constraint error"))
        .mockRejectedValueOnce(new Error("Constraint error"))
        .mockResolvedValueOnce(mockUser);

      const result = await service.createApiKey();

      expect(result).toMatch(/^ak_test_[a-f0-9]{64}$/);
      expect(usersService.update).toHaveBeenCalledTimes(3);
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      (CtxModule as any).Ctx = {
        userId: mockUser.id,
        sessionId: mockTokenPayload.sid,
      };

      cacheManager.del.mockResolvedValue(true);

      await service.logout();

      expect(cacheManager.del).toHaveBeenCalledWith(
        `refresh_tokens:${mockUser.id}:${mockTokenPayload.sid}`,
      );
    });

    it("should throw UnauthorizedError for missing userId", async () => {
      (CtxModule as any).Ctx = {
        userId: null,
        sessionId: mockTokenPayload.sid,
      };

      await expect(service.logout()).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError for missing sessionId", async () => {
      (CtxModule as any).Ctx = {
        userId: mockUser.id,
        sessionId: null,
      };

      await expect(service.logout()).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("findUserByApiKey edge cases", () => {
    it("should throw UnauthorizedError when user has no apiKeySecret", async () => {
      const userWithoutSecret = { ...mockUser, apiKeySecret: "" };
      cacheManager.get.mockResolvedValue(null);
      usersService.findBy.mockResolvedValue(userWithoutSecret);

      await expect(service.findUserByApiKey("valid-api-key")).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("should cache user after successful API key validation", async () => {
      cacheManager.get.mockResolvedValue(null);
      usersService.findBy.mockResolvedValue(mockUser);
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.findUserByApiKey("valid-api-key");

      expect(result).toEqual(mockUser);
      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        mockUser,
        expect.any(Number),
      );
    });
  });

  describe("login edge cases", () => {
    it("should throw InvalidCredentialsError for incorrect password", async () => {
      usersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.login("johndoe", "wrongpassword")).rejects.toThrow(
        InvalidCredentialsError,
      );
    });
  });
});
