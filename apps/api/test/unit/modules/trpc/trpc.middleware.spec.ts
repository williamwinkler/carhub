/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseError } from "@api/common/errors/base-error";
import { UnauthorizedError } from "@api/common/errors/domain/unauthorized.error";
import { TRPCError } from "@trpc/server";
import { ClsServiceManager } from "nestjs-cls";
import {
  createAuthMiddleware,
  RateLimitTiers,
} from "@api/modules/trpc/trpc.middleware";
import * as CtxModule from "@api/common/ctx";

// Mock dependencies
jest.mock("nestjs-cls");
jest.mock("@api/common/utils/context.utils");
jest.mock("@api/common/ctx");

const mockClsService = {
  runWith: jest.fn((context, fn) => fn()),
};

const mockAuthService = {
  verifyAccessToken: jest.fn(),
  principalFromJwt: jest.fn(),
};

const mockRateLimitService = {
  checkRateLimit: jest.fn(),
};

const mockCtx = {
  requestId: "test-request-id",
  correlationId: "test-correlation-id",
  principal: undefined as any,
};

beforeEach(() => {
  jest.clearAllMocks();
  (ClsServiceManager.getClsService as jest.Mock).mockReturnValue(
    mockClsService,
  );
  (CtxModule as any).Ctx = mockCtx;
});

describe("tRPC Middleware", () => {
  describe("RateLimitTiers", () => {
    it("should have correct rate limit tier configurations", () => {
      expect(RateLimitTiers.SHORT).toEqual({
        windowMs: 1000,
        max: 3,
      });

      expect(RateLimitTiers.MEDIUM).toEqual({
        windowMs: 10000,
        max: 20,
      });

      expect(RateLimitTiers.LONG).toEqual({
        windowMs: 60000,
        max: 100,
      });
    });
  });

  describe("createAuthMiddleware", () => {
    it("should create auth middleware object", () => {
      const authMiddleware = createAuthMiddleware(mockAuthService as any);

      expect(typeof authMiddleware).toBe("object");
      expect(authMiddleware).toBeDefined();
    });
  });

  describe("error handling utilities", () => {
    it("should create UnauthorizedError with correct error code", () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error.error.errorCode).toBe(3000);
    });

    it("should create TRPCError correctly", () => {
      const error = new TRPCError({
        code: "UNAUTHORIZED",
        message: "Test error",
      });

      expect(error).toBeInstanceOf(TRPCError);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Test error");
    });
  });
});
