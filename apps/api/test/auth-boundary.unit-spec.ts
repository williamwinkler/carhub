import { AuthGuard } from "@api/common/guards/auth.guard";
import type { AuthService } from "@api/modules/auth/auth.service";
import type { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { ClsServiceManager } from "nestjs-cls";

const user = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  role: "user",
};

function createExecutionContext(headers: Request["headers"]): ExecutionContext {
  const request = { headers } as Request & {
    user?: { id: string; roles: string[] };
  };

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => request),
    })),
  } as unknown as ExecutionContext;
}

describe("AuthGuard REST auth boundary", () => {
  let guard: AuthGuard;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(() => {
    authService = {
      isApiKeyValid: jest.fn().mockReturnValue(true),
      findUserByApiKey: jest.fn().mockResolvedValue(user),
      principalFromUser: jest.fn().mockReturnValue({
        id: user.id,
        role: user.role,
        authType: "api-key",
      }),
      verifyAccessToken: jest.fn(),
    };

    guard = new AuthGuard(
      authService as AuthService,
      { getAllAndOverride: jest.fn().mockReturnValue(false) } as unknown as Reflector,
    );
  });

  it("rejects bearer JWT without x-api-key", async () => {
    await expect(
      guard.canActivate(
        createExecutionContext({ authorization: "Bearer valid.jwt.token" }),
      ),
    ).rejects.toThrow("You need to be authorized to perform this action");

    expect(authService.verifyAccessToken).not.toHaveBeenCalled();
    expect(authService.findUserByApiKey).not.toHaveBeenCalled();
  });

  it("accepts a valid API key", async () => {
    const context = createExecutionContext({ "x-api-key": "sk_test_valid" });

    await expect(
      ClsServiceManager.getClsService().runWith({}, () =>
        guard.canActivate(context),
      ),
    ).resolves.toBe(true);

    expect(authService.isApiKeyValid).toHaveBeenCalledWith("sk_test_valid");
    expect(authService.findUserByApiKey).toHaveBeenCalledWith("sk_test_valid");
  });
});
