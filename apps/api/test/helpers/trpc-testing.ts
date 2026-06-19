import type { Principal } from "@api/common/ctx";
import { AccountsAdapter } from "@api/modules/accounts/acounts.adapter";
import { AuthService } from "@api/modules/auth/auth.service";
import { CarManufacturersAdapter } from "@api/modules/car-manufacturers/car-manufacturers.adapter";
import { CarManufacturersService } from "@api/modules/car-manufacturers/car-manufacturers.service";
import { CarModelsAdapter } from "@api/modules/car-models/car-models.adapter";
import { CarModelsService } from "@api/modules/car-models/car-models.service";
import { CarsAdapter } from "@api/modules/cars/cars.adapter";
import { CarsService } from "@api/modules/cars/cars.service";
import { TrpcRateLimitService } from "@api/modules/trpc/trpc-rate-limit.service";
import {
  type TrpcContext,
  TrpcContextFactory,
} from "@api/modules/trpc/trpc.context";
import type { AppRouter } from "@api/modules/trpc/trpc.router";
import { TrpcRouter } from "@api/modules/trpc/trpc.router";
import { TrpcService } from "@api/modules/trpc/trpc.service";
import { UsersService } from "@api/modules/users/users.service";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";
import { ClsModule } from "nestjs-cls";

export type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : T[K];
};

export type TrpcTestMocks = {
  authService: Mocked<Partial<AuthService>>;
  usersService: Record<string, jest.Mock>;
  accountsAdapter: Record<string, jest.Mock>;
  carsService: Record<string, jest.Mock>;
  carsAdapter: Record<string, jest.Mock>;
  carModelsService: Record<string, jest.Mock>;
  carModelsAdapter: Record<string, jest.Mock>;
  carManufacturersService: Record<string, jest.Mock>;
  carManufacturersAdapter: Record<string, jest.Mock>;
  rateLimitService: { checkRateLimit: jest.Mock };
};

const defaultPrincipal: Principal = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  role: "user",
  authType: "jwt",
  sessionId: "550e8400-e29b-41d4-a716-446655440001",
};

const emptyPage = {
  items: [],
  meta: { totalItems: 0, limit: 10, skipped: 0, count: 0 },
};

const carDto = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  year: 2022,
  color: "blue",
  kmDriven: 12_000,
  price: 25_000,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

export function createMockPrincipal(
  overrides: Partial<Principal> = {},
): Principal {
  return { ...defaultPrincipal, ...overrides };
}

export function createMockTrpcContext(
  overrides: Partial<TrpcContext> & {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {},
): TrpcContext {
  const req = {
    headers: overrides.headers ?? {},
    cookies: overrides.cookies ?? {},
    socket: { remoteAddress: "127.0.0.1" },
    ...overrides.req,
  } as unknown as Request;

  const res = {
    setHeader: jest.fn(),
    cookie: jest.fn(),
    ...overrides.res,
  } as unknown as Response;

  return {
    req,
    res,
    principal: overrides.principal ?? null,
  };
}

export async function createTrpcTestApp(): Promise<{
  app: INestApplication;
  appRouter: AppRouter;
  mocks: TrpcTestMocks;
}> {
  const mocks = createDefaultMocks();

  const moduleRef = await Test.createTestingModule({
    imports: [ClsModule.forRoot({ global: true })],
    providers: [
      TrpcService,
      TrpcRouter,
      TrpcContextFactory,
      { provide: AuthService, useValue: mocks.authService },
      { provide: UsersService, useValue: mocks.usersService },
      { provide: AccountsAdapter, useValue: mocks.accountsAdapter },
      { provide: CarsService, useValue: mocks.carsService },
      { provide: CarsAdapter, useValue: mocks.carsAdapter },
      { provide: CarModelsService, useValue: mocks.carModelsService },
      { provide: CarModelsAdapter, useValue: mocks.carModelsAdapter },
      {
        provide: CarManufacturersService,
        useValue: mocks.carManufacturersService,
      },
      {
        provide: CarManufacturersAdapter,
        useValue: mocks.carManufacturersAdapter,
      },
      { provide: TrpcRateLimitService, useValue: mocks.rateLimitService },
    ],
  }).compile();

  const app = moduleRef.createNestApplication({ bodyParser: false });
  app.use(cookieParser());

  const trpcRouter = app.get(TrpcRouter);
  trpcRouter.applyMiddleware(app);

  await app.init();

  return {
    app,
    appRouter: trpcRouter.appRouter,
    mocks,
  };
}

function createDefaultMocks(): TrpcTestMocks {
  const accountDto = {
    id: defaultPrincipal.id,
    username: "william",
    firstName: "William",
    lastName: "Winkler",
    role: "user",
    hasApiKey: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };

  return {
    authService: {
      login: jest.fn().mockResolvedValue({
        accessToken:
          "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAifQ.signature",
        refreshToken: "refresh-token",
        refreshTokenCookieOptions: { httpOnly: true, path: "/" },
      }),
      logout: jest.fn().mockResolvedValue(undefined),
      refreshToken: jest.fn().mockResolvedValue({
        accessToken:
          "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAifQ.signature",
        refreshToken: "rotated-refresh-token",
        refreshTokenCookieOptions: { httpOnly: true, path: "/" },
      }),
      createApiKey: jest.fn().mockResolvedValue("sk_test_" + "a".repeat(64)),
      verifyAccessToken: jest.fn().mockResolvedValue({
        sub: defaultPrincipal.id,
        sid: defaultPrincipal.sessionId,
        role: defaultPrincipal.role,
        iss: "CarHub API",
        firstName: "William",
        lastName: "Winkler",
      }),
      principalFromJwt: jest.fn().mockReturnValue(defaultPrincipal),
      isApiKeyValid: jest.fn().mockReturnValue(true),
      findUserByApiKey: jest
        .fn()
        .mockResolvedValue({ id: defaultPrincipal.id, role: "user" }),
    },
    usersService: {
      findById: jest.fn().mockResolvedValue({ id: defaultPrincipal.id }),
      update: jest.fn().mockResolvedValue({ id: defaultPrincipal.id }),
      findByUsername: jest.fn().mockResolvedValue({ id: defaultPrincipal.id }),
    },
    accountsAdapter: {
      getDto: jest.fn().mockReturnValue(accountDto),
    },
    carsService: {
      findAll: jest.fn().mockResolvedValue(emptyPage),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: carDto.id }),
      update: jest.fn().mockResolvedValue({ id: carDto.id }),
      softDelete: jest.fn(),
      toggleFavoriteForUser: jest.fn().mockResolvedValue(true),
      getFavoritesByUser: jest.fn().mockResolvedValue(emptyPage),
      getCarsByUser: jest.fn().mockResolvedValue(emptyPage),
    },
    carsAdapter: {
      getDto: jest.fn().mockReturnValue(carDto),
      getListDto: jest.fn().mockReturnValue(emptyPage),
    },
    carModelsService: {
      findAll: jest.fn().mockResolvedValue(emptyPage),
    },
    carModelsAdapter: {
      getListDto: jest.fn().mockReturnValue(emptyPage),
    },
    carManufacturersService: {
      findAll: jest.fn().mockResolvedValue(emptyPage),
    },
    carManufacturersAdapter: {
      getListDto: jest.fn().mockReturnValue(emptyPage),
    },
    rateLimitService: {
      checkRateLimit: jest.fn().mockResolvedValue({
        allowed: true,
        limit: 100,
        remaining: 99,
        resetTime: Date.now() + 60_000,
      }),
    },
  };
}
