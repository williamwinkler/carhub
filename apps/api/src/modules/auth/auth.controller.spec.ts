/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { MockMetadata } from "jest-mock";
import { ModuleMocker } from "jest-mock";
import { randomUUID } from "crypto";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersAdapter } from "../users/users.adapter";
import type { User } from "../users/entities/user.entity";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";
import type { RefreshTokenDto } from "./dto/refresh-token.dto";

const moduleMocker = new ModuleMocker(global);

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let usersAdapter: jest.Mocked<UsersAdapter>;

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

  const mockUserDto = {
    id: mockUser.id,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    username: mockUser.username,
    role: mockUser.role,
    hasApiKey: false,
    createdAt: mockUser.createdAt.toISOString(),
    updatedAt: mockUser.updatedAt.toISOString(),
  };

  const mockTokens = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
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

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    usersAdapter = module.get(UsersAdapter);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createAccount", () => {
    it("should register a new user successfully", async () => {
      const registerDto: RegisterDto = {
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        password: "password123",
        role: "user",
      };

      authService.register.mockResolvedValue(mockUser);
      usersAdapter.getUserDto.mockReturnValue(mockUserDto);

      const result = await controller.createAccount(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(usersAdapter.getUserDto).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUserDto);
    });

    it("should register an admin user successfully", async () => {
      const registerDto: RegisterDto = {
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        password: "adminpass123",
        role: "admin",
      };

      const adminUser = { ...mockUser, role: "admin" as const };
      const adminUserDto = { ...mockUserDto, role: "admin" as const };

      authService.register.mockResolvedValue(adminUser);
      usersAdapter.getUserDto.mockReturnValue(adminUserDto);

      const result = await controller.createAccount(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result.role).toBe("admin");
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const loginDto: LoginDto = {
        username: "johndoe",
        password: "password123",
      };

      authService.login.mockResolvedValue(mockTokens);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
      expect(result).toEqual(mockTokens);
    });
  });

  describe("refresh", () => {
    it("should refresh tokens successfully", async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: "old-refresh-token",
      };

      const newTokens = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };

      authService.refreshTokens.mockResolvedValue(newTokens);

      const result = await controller.refresh(refreshTokenDto);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
      expect(result).toEqual(newTokens);
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      authService.logout.mockResolvedValue(undefined);

      await controller.logout();

      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe("createApiKey", () => {
    it("should create API key without userId", async () => {
      const mockApiKey = "ak_test_api_key_1234567890abcdef";

      authService.createApiKey.mockResolvedValue(mockApiKey);

      const result = await controller.createApiKey();

      expect(authService.createApiKey).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ apiKey: mockApiKey });
    });

    it("should create API key for specific userId", async () => {
      const userId = randomUUID();
      const mockApiKey = "ak_test_api_key_1234567890abcdef";

      authService.createApiKey.mockResolvedValue(mockApiKey);

      const result = await controller.createApiKey(userId);

      expect(authService.createApiKey).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ apiKey: mockApiKey });
    });
  });
});
