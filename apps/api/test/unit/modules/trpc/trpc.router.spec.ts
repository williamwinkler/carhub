/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { MockMetadata } from "jest-mock";
import { ModuleMocker } from "jest-mock";
import type { INestApplication } from "@nestjs/common";
import { TrpcRouter } from "@api/modules/trpc/trpc.router";
import { TrpcService } from "@api/modules/trpc/trpc.service";
import { AuthTrpc } from "@api/modules/auth/auth.trpc";
import { CarsTrpc } from "@api/modules/cars/cars.trpc";

const moduleMocker = new ModuleMocker(global);

describe("TrpcRouter", () => {
  let trpcRouter: TrpcRouter;
  let trpcService: jest.Mocked<TrpcService>;
  let authTrpc: jest.Mocked<AuthTrpc>;
  let carsTrpc: jest.Mocked<CarsTrpc>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrpcRouter],
    })
      .useMocker((token) => {
        if (typeof token === "function") {
          const metadata = moduleMocker.getMetadata(token) as MockMetadata<
            any,
            any
          >;
          const Mock = moduleMocker.generateFromMetadata(metadata);

          // Special handling for TrpcService to provide router method
          if (token === TrpcService) {
            const mock = new Mock();
            mock.router = jest.fn((routes) => routes);

            return mock;
          }

          // Special handling for AuthTrpc to provide router
          if (token === AuthTrpc) {
            const mock = new Mock();
            mock.router = { login: "mock-auth-login" };

            return mock;
          }

          // Special handling for CarsTrpc to provide router
          if (token === CarsTrpc) {
            const mock = new Mock();
            mock.router = { list: "mock-cars-list" };

            return mock;
          }

          return new Mock();
        }
      })
      .compile();

    trpcRouter = module.get<TrpcRouter>(TrpcRouter);
    trpcService = module.get(TrpcService);
    authTrpc = module.get(AuthTrpc);
    carsTrpc = module.get(CarsTrpc);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(trpcRouter).toBeDefined();
  });

  it("should have appRouter defined", () => {
    expect(trpcRouter.appRouter).toBeDefined();
  });

  it("should have access to required services", () => {
    expect(trpcService).toBeDefined();
    expect(authTrpc).toBeDefined();
    expect(carsTrpc).toBeDefined();
  });

  describe("applyMiddleware", () => {
    let mockApp: jest.Mocked<INestApplication>;

    beforeEach(() => {
      mockApp = {
        use: jest.fn(),
      } as any;
    });

    it("should apply tRPC middleware to express app", async () => {
      await trpcRouter.applyMiddleware(mockApp);

      expect(mockApp.use).toHaveBeenCalledWith(
        "/trpc",
        expect.any(Function), // The Express middleware function
      );
    });

    it("should call applyMiddleware without errors", async () => {
      await expect(trpcRouter.applyMiddleware(mockApp)).resolves.not.toThrow();
    });
  });
});
