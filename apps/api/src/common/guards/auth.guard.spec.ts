/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "crypto";
import type { TokenPayload } from "@api/modules/auth/auth.service";
import { AuthService } from "@api/modules/auth/auth.service";
import type { User } from "@api/modules/users/entities/user.entity";
import * as CtxModule from "../ctx";
import { UnauthorizedError } from "../errors/domain/unauthorized.error";
import { AuthGuard } from "./auth.guard";

// Mock the Ctx module
jest.mock("../ctx", () => ({
  Ctx: {
    principal: null,
  },
}));

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let authService: jest.Mocked<AuthService>;
  let reflector: jest.Mocked<Reflector>;
  let mockContext: jest.Mocked<ExecutionContext>;

  const mockUser: User = {
    id: randomUUID(),
    username: "testuser",
    role: "user" as const,
    firstName: "Test",
    lastName: "User",
    password: "hashedpassword",
    cars: [],
    favorites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJwtPayload: TokenPayload = {
    iss: "test-issuer",
    sub: mockUser.id,
    sid: randomUUID(),
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: mockUser.role,
  };

  const mockPrincipal = {
    id: mockUser.id,
    role: mockUser.role,
    authType: "jwt" as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: AuthService,
          useValue: {
            verifyAccessToken: jest.fn(),
            findUserByApiKey: jest.fn(),
            principalFromJwt: jest.fn(),
            principalFromUser: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;

    // Mock ExecutionContext
    const mockHttpArgumentsHost = {
      getRequest: jest.fn(),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
    } as jest.Mocked<ExecutionContext>;

    // Reset Ctx.principal before each test
    CtxModule.Ctx.principal = null;
  });

  describe("canActivate", () => {
    describe("public endpoints", () => {
      it("should allow access to public endpoints without authentication", async () => {
        reflector.getAllAndOverride.mockReturnValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith("isPublic", [
          mockContext.getHandler(),
          mockContext.getClass(),
        ]);
      });
    });

    describe("JWT authentication", () => {
      beforeEach(() => {
        reflector.getAllAndOverride.mockReturnValue(false);
        authService.verifyAccessToken.mockResolvedValue(mockJwtPayload);
        authService.principalFromJwt.mockReturnValue(mockPrincipal);
      });

      it("should authenticate user with valid JWT token", async () => {
        const mockRequest: any = {
          headers: {
            authorization: "Bearer validtoken123",
          },
          user: undefined,
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(authService.verifyAccessToken).toHaveBeenCalledWith(
          "validtoken123",
        );
        expect(authService.principalFromJwt).toHaveBeenCalledWith(
          mockJwtPayload,
        );
        expect(CtxModule.Ctx.principal).toBe(mockPrincipal);
        expect(mockRequest.user).toEqual({
          ...mockJwtPayload,
          roles: [mockJwtPayload.role],
        });
      });

      it("should handle different Bearer token formats", async () => {
        const mockRequest: any = {
          headers: {
            authorization: "Bearer token123",
          },
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(authService.verifyAccessToken).toHaveBeenCalledWith("token123");
      });

      it("should throw UnauthorizedError when JWT verification fails", async () => {
        const mockRequest: any = {
          headers: {
            authorization: "Bearer invalidtoken",
          },
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        authService.verifyAccessToken.mockRejectedValue(
          new Error("Invalid token"),
        );

        await expect(guard.canActivate(mockContext)).rejects.toThrow();
      });
    });

    describe("API Key authentication", () => {
      beforeEach(() => {
        reflector.getAllAndOverride.mockReturnValue(false);
        authService.findUserByApiKey.mockResolvedValue(mockUser);
        authService.principalFromUser.mockReturnValue({
          ...mockPrincipal,
          authType: "api-key",
        });
      });

      it("should authenticate user with valid API key", async () => {
        const mockRequest: any = {
          headers: {
            "x-api-key": "validapikey123",
          },
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(authService.findUserByApiKey).toHaveBeenCalledWith(
          "validapikey123",
        );
        expect(authService.principalFromUser).toHaveBeenCalledWith(mockUser);
        expect(CtxModule.Ctx.principal).toEqual({
          ...mockPrincipal,
          authType: "api-key",
        });
        expect(mockRequest.user).toEqual({
          id: mockUser.id,
          roles: [mockUser.role],
        });
      });

      it("should reject array API keys", async () => {
        const mockRequest: any = {
          headers: {
            "x-api-key": ["key1", "key2"],
          },
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          UnauthorizedError,
        );
        expect(authService.findUserByApiKey).not.toHaveBeenCalled();
      });

      it("should throw UnauthorizedError when API key lookup fails", async () => {
        const mockRequest: any = {
          headers: {
            "x-api-key": "invalidkey",
          },
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        authService.findUserByApiKey.mockRejectedValue(
          new Error("Invalid API key"),
        );

        await expect(guard.canActivate(mockContext)).rejects.toThrow();
      });
    });

    describe("authentication priority", () => {
      beforeEach(() => {
        reflector.getAllAndOverride.mockReturnValue(false);
        authService.verifyAccessToken.mockResolvedValue(mockJwtPayload);
        authService.principalFromJwt.mockReturnValue(mockPrincipal);
      });

      it("should prefer JWT token over API key when both are present", async () => {
        const mockRequest: any = {
          headers: {
            authorization: "Bearer jwttoken123",
            "x-api-key": "apikey123",
          },
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(authService.verifyAccessToken).toHaveBeenCalledWith(
          "jwttoken123",
        );
        expect(authService.findUserByApiKey).not.toHaveBeenCalled();
      });
    });

    describe("missing credentials", () => {
      beforeEach(() => {
        reflector.getAllAndOverride.mockReturnValue(false);
      });

      it("should throw UnauthorizedError when no credentials provided", async () => {
        const mockRequest: any = { headers: {} };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          UnauthorizedError,
        );
      });

      it("should throw UnauthorizedError with malformed authorization header", async () => {
        const mockRequest: any = {
          headers: {
            authorization: "InvalidFormat token123",
          },
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          UnauthorizedError,
        );
      });

      it("should throw UnauthorizedError with only authorization type", async () => {
        const mockRequest: any = {
          headers: {
            authorization: "Bearer",
          },
        };
        (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
          mockRequest,
        );

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          UnauthorizedError,
        );
      });
    });
  });

  describe("extractTokenFromHeader", () => {
    it("should extract token from Bearer authorization header", () => {
      const request = {
        headers: {
          authorization: "Bearer mytoken123",
        },
      } as any;

      const token = (guard as any).extractTokenFromHeader(request);
      expect(token).toBe("mytoken123");
    });

    it("should return undefined for non-Bearer authorization", () => {
      const request = {
        headers: {
          authorization: "Basic dXNlcjpwYXNz",
        },
      } as any;

      const token = (guard as any).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it("should return undefined when authorization header is missing", () => {
      const request = { headers: {} } as any;

      const token = (guard as any).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });
  });

  describe("extractApiKeyFromHeader", () => {
    it("should extract API key from x-api-key header", () => {
      const request = {
        headers: {
          "x-api-key": "myapikey123",
        },
      } as any;

      const apiKey = (guard as any).extractApiKeyFromHeader(request);
      expect(apiKey).toBe("myapikey123");
    });

    it("should return undefined for array API key values", () => {
      const request = {
        headers: {
          "x-api-key": ["key1", "key2"],
        },
      } as any;

      const apiKey = (guard as any).extractApiKeyFromHeader(request);
      expect(apiKey).toBeUndefined();
    });

    it("should return undefined when x-api-key header is missing", () => {
      const request = { headers: {} } as any;

      const apiKey = (guard as any).extractApiKeyFromHeader(request);
      expect(apiKey).toBeUndefined();
    });
  });
});
