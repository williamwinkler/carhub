import { REFRESH_TOKEN_COOKIE_NAME } from "@api/modules/auth/auth.consts";
import type { TRPCError } from "@trpc/server";
import {
  createMockPrincipal,
  createMockTrpcContext,
  createTrpcTestApp,
} from "./helpers/trpc-testing";

describe("tRPC auth boundary", () => {
  it("accepts JWT-authenticated tRPC callers", async () => {
    const { app, appRouter, mocks } = await createTrpcTestApp();

    try {
      const caller = appRouter.createCaller(
        createMockTrpcContext({ principal: createMockPrincipal() }),
      );

      await expect(caller.accounts.getMe()).resolves.toMatchObject({
        id: "550e8400-e29b-41d4-a716-446655440000",
        username: "william",
      });
      expect(mocks.usersService.findById).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
      );
    } finally {
      await app.close();
    }
  });

  it("refreshes JWTs from the refresh-token cookie", async () => {
    const { app, appRouter, mocks } = await createTrpcTestApp();

    try {
      const context = createMockTrpcContext({
        cookies: { [REFRESH_TOKEN_COOKIE_NAME]: "refresh-token" },
      });
      const caller = appRouter.createCaller(context);

      await expect(caller.auth.refreshToken()).resolves.toEqual({
        accessToken:
          "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAifQ.signature",
      });
      expect(mocks.authService.refreshToken).toHaveBeenCalledWith(
        "refresh-token",
      );
      expect(context.res.cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME,
        "rotated-refresh-token",
        { httpOnly: true, path: "/" },
      );
    } finally {
      await app.close();
    }
  });

  it("keys authenticated rate limits by JWT principal and procedure", async () => {
    const { app, appRouter, mocks } = await createTrpcTestApp();

    try {
      const caller = appRouter.createCaller(
        createMockTrpcContext({ principal: createMockPrincipal() }),
      );

      await caller.accounts.getMe();

      expect(mocks.rateLimitService.checkRateLimit).toHaveBeenCalledWith(
        "user:550e8400-e29b-41d4-a716-446655440000:query:accounts.getMe",
        60_000,
        100,
      );
    } finally {
      await app.close();
    }
  });

  it("keys anonymous public rate limits by IP and procedure", async () => {
    const { app, appRouter, mocks } = await createTrpcTestApp();

    try {
      const caller = appRouter.createCaller(createMockTrpcContext());

      await caller.auth.login({ username: "william", password: "secret1" });

      expect(mocks.rateLimitService.checkRateLimit).toHaveBeenCalledWith(
        "ip:127.0.0.1:mutation:auth.login",
        60_000,
        100,
      );
      expect(mocks.rateLimitService.checkRateLimit).toHaveBeenCalledWith(
        "ip:127.0.0.1:mutation:auth.login",
        1_000,
        3,
      );
    } finally {
      await app.close();
    }
  });

  it("rejects requests when the rate-limit bucket is exhausted", async () => {
    const { app, appRouter, mocks } = await createTrpcTestApp();

    try {
      mocks.rateLimitService.checkRateLimit.mockResolvedValueOnce({
        allowed: false,
        limit: 100,
        remaining: 0,
        resetTime: Date.now() + 60_000,
        retryAfter: 60,
      });
      const caller = appRouter.createCaller(createMockTrpcContext());

      await expect(
        caller.auth.login({ username: "william", password: "secret1" }),
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
        message: expect.stringContaining("Rate limit exceeded"),
      } satisfies Partial<TRPCError>);
      expect(mocks.authService.login).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it("allows public list queries without JWT and validates their outputs", async () => {
    const { app, appRouter, mocks } = await createTrpcTestApp();

    try {
      const caller = appRouter.createCaller(createMockTrpcContext());

      await expect(caller.cars.list({})).resolves.toEqual({
        items: [],
        meta: { totalItems: 0, limit: 10, skipped: 0, count: 0 },
      });
      await expect(caller.carModels.list()).resolves.toEqual({
        items: [],
        meta: { totalItems: 0, limit: 10, skipped: 0, count: 0 },
      });
      await expect(caller.carManufacturers.list()).resolves.toEqual({
        items: [],
        meta: { totalItems: 0, limit: 10, skipped: 0, count: 0 },
      });

      expect(mocks.carsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, limit: 10 }),
      );
      expect(mocks.carModelsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, limit: 100 }),
      );
      expect(mocks.carManufacturersService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, limit: 100 }),
      );
    } finally {
      await app.close();
    }
  });

  it("rejects stale-user JWTs with a structured tRPC error", async () => {
    const { app, appRouter, mocks } = await createTrpcTestApp();

    try {
      mocks.usersService.findById.mockResolvedValueOnce(null);
      const caller = appRouter.createCaller(
        createMockTrpcContext({ principal: createMockPrincipal() }),
      );

      await expect(caller.accounts.getMe()).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "User not found",
        cause: expect.objectContaining({ errorCode: "USER_NOT_FOUND" }),
      } satisfies Partial<TRPCError>);
    } finally {
      await app.close();
    }
  });

  it("rejects account outputs that include entity-only fields", async () => {
    const { app, appRouter, mocks } = await createTrpcTestApp();

    try {
      mocks.accountsAdapter.getDto.mockReturnValueOnce({
        id: "550e8400-e29b-41d4-a716-446655440000",
        username: "william",
        firstName: "William",
        lastName: "Winkler",
        role: "user",
        hasApiKey: true,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        password: "must-not-leak",
      });
      const caller = appRouter.createCaller(
        createMockTrpcContext({ principal: createMockPrincipal() }),
      );

      await expect(caller.accounts.getMe()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Output validation failed",
      } satisfies Partial<TRPCError>);
    } finally {
      await app.close();
    }
  });

  it("rejects API-key-only tRPC callers", async () => {
    const { app, appRouter } = await createTrpcTestApp();

    try {
      const caller = appRouter.createCaller(
        createMockTrpcContext({
          headers: { "x-api-key": "sk_test_valid" },
          principal: null,
        }),
      );

      await expect(caller.accounts.getMe()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      } satisfies Partial<TRPCError>);
    } finally {
      await app.close();
    }
  });
});
