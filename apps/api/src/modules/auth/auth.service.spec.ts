import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { JwtService } from "@nestjs/jwt";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { Cache } from "cache-manager";
import { randomUUID } from "crypto";
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../../common/errors/domain/bad-request.error";
import { UnauthorizedError } from "../../common/errors/domain/unauthorized.error";
import { ConfigService } from "../config/config.service";
import type { Role, User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import type { TokenPayload } from "./auth.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let cacheManager: jest.Mocked<Cache>;

  const mockUser: User = {
    id: randomUUID(),
    role: "user" as Role,
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    password: "password123",
    apiKey: "test-api-key",
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
    const mockUsersService = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByApiKey: jest.fn(),
    };

    const mockJwtService = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    cacheManager = module.get(CACHE_MANAGER);
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
    it("should return user when API key is valid", async () => {
      usersService.findByApiKey.mockResolvedValue(mockUser);

      const result = await service.findUserByApiKey("valid-api-key");

      expect(result).toEqual(mockUser);
      expect(usersService.findByApiKey).toHaveBeenCalledWith("valid-api-key");
    });

    it("should throw UnauthorizedError when user not found", async () => {
      usersService.findByApiKey.mockResolvedValue(null);

      await expect(service.findUserByApiKey("invalid-api-key")).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe("login", () => {
    it("should return tokens for valid credentials", async () => {
      const expectedTokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      usersService.findOne.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce("refresh-token");
      configService.get.mockReturnValue("refresh-secret");
      cacheManager.set.mockResolvedValue(undefined);

      const result = await service.login("johndoe", "password123");

      expect(result).toEqual(expectedTokens);
      expect(usersService.findOne).toHaveBeenCalledWith("johndoe");
    });

    it("should throw InvalidCredentialsError for wrong password", async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      await expect(service.login("johndoe", "wrong-password")).rejects.toThrow(
        InvalidCredentialsError,
      );
    });

    it("should throw InvalidCredentialsError for non-existent user", async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(service.login("nonexistent", "password")).rejects.toThrow(
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
});
