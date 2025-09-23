/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { MockMetadata } from "jest-mock";
import { ModuleMocker } from "jest-mock";

import { RolesGuard } from "@api/common/guards/roles.guard";
import type { RoleType } from "@api/modules/users/entities/user.entity";
import { ForbiddenError } from "@api/common/errors/domain/forbidden.error";
import * as CtxModule from "@api/common/ctx";

const moduleMocker = new ModuleMocker(global);

// Mock the Ctx module
jest.mock("@api/common/ctx", () => ({
  Ctx: {
    roleRequired: jest.fn(),
  },
}));

describe("RolesGuard (Unit)", () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard],
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

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

    // Mock ExecutionContext
    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up reflector mock
    reflector.getAllAndOverride = jest.fn();
  });

  describe("canActivate", () => {
    describe("when no roles are required", () => {
      it("should allow access when no roles metadata is set", () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);

        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith("roles", [
          mockContext.getHandler(),
          mockContext.getClass(),
        ]);
      });

      it("should allow access when roles array is empty", () => {
        reflector.getAllAndOverride.mockReturnValue([]);

        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
      });

      it("should allow access when roles is null", () => {
        reflector.getAllAndOverride.mockReturnValue(null);

        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
      });
    });

    describe("when roles are required", () => {
      it("should allow access when user has required role", () => {
        const requiredRoles: RoleType[] = ["user"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("user");

        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(CtxModule.Ctx.roleRequired).toHaveBeenCalled();
      });

      it("should allow access when user has one of multiple required roles", () => {
        const requiredRoles: RoleType[] = ["user", "admin"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("admin");

        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
      });

      it("should allow access when admin user accesses any resource", () => {
        const requiredRoles: RoleType[] = ["user"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("admin");

        // Admin should have access to all resources - they are super users
        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
      });

      it("should throw ForbiddenException when user does not have required role", () => {
        const requiredRoles: RoleType[] = ["admin"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("user");

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenError);
      });

      it("should throw ForbiddenException when user role is null", () => {
        const requiredRoles: RoleType[] = ["user"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue(null);

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenError);
      });

      it("should throw ForbiddenException when user role is undefined", () => {
        const requiredRoles: RoleType[] = ["user"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue(undefined);

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenError);
      });
    });

    describe("multiple role scenarios", () => {
      it("should handle multiple required roles correctly", () => {
        const requiredRoles: RoleType[] = ["admin", "user"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("user");

        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
      });

      it("should throw ForbiddenException when user role not in required roles list", () => {
        const requiredRoles: RoleType[] = ["admin"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("user");

        expect(() => guard.canActivate(mockContext)).toThrow(
          new ForbiddenError("Insufficient role"),
        );
      });
    });

    describe("edge cases", () => {
      it("should handle empty string role", () => {
        const requiredRoles: RoleType[] = ["user"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("");

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenError);
      });

      it("should be case-sensitive for roles", () => {
        const requiredRoles: RoleType[] = ["user"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue(
          "USER" as any,
        );

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenError);
      });
    });

    describe("reflector integration", () => {
      it("should correctly call reflector with proper keys and targets", () => {
        const requiredRoles: RoleType[] = ["admin"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("admin");

        guard.canActivate(mockContext);

        expect(reflector.getAllAndOverride).toHaveBeenCalledWith("roles", [
          mockContext.getHandler(),
          mockContext.getClass(),
        ]);
      });

      it("should handle unexpected data types from reflector gracefully", () => {
        // Test with string instead of array (edge case)
        reflector.getAllAndOverride.mockReturnValue("user" as any);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("user");

        const result = guard.canActivate(mockContext);

        // String includes works for substrings, so 'user'.includes('user') = true
        expect(result).toBe(true);
      });
    });

    describe("admin privilege logic", () => {
      it("should allow admin to bypass all role checks", () => {
        const restrictiveRoles: RoleType[] = ["admin"]; // Role that admin bypasses anyway
        reflector.getAllAndOverride.mockReturnValue(restrictiveRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("admin");

        const result = guard.canActivate(mockContext);

        expect(result).toBe(true);
      });

      it("should enforce role checks for non-admin users", () => {
        const requiredRoles: RoleType[] = ["admin"];
        reflector.getAllAndOverride.mockReturnValue(requiredRoles);
        (CtxModule.Ctx.roleRequired as jest.Mock).mockReturnValue("user");

        expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenError);
      });
    });
  });
});
