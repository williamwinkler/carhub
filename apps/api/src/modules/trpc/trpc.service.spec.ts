/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { MockMetadata } from "jest-mock";
import { ModuleMocker } from "jest-mock";
import { AuthService } from "../auth/auth.service";
import { TrpcRateLimitService } from "./trpc-rate-limit.service";
import { TrpcService, createContext } from "./trpc.service";

const moduleMocker = new ModuleMocker(global);

describe("TrpcService", () => {
  let trpcService: TrpcService;
  let authService: jest.Mocked<AuthService>;
  let rateLimitService: jest.Mocked<TrpcRateLimitService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrpcService],
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

    trpcService = module.get<TrpcService>(TrpcService);
    authService = module.get(AuthService);
    rateLimitService = module.get(TrpcRateLimitService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(trpcService).toBeDefined();
  });

  it("should have trpc instance", () => {
    expect(trpcService.trpc).toBeDefined();
  });

  it("should have all required procedures", () => {
    expect(trpcService.procedure).toBeDefined();
    expect(trpcService.authenticatedProcedure).toBeDefined();
    expect(trpcService.shortRateLimitProcedure).toBeDefined();
    expect(trpcService.mediumRateLimitProcedure).toBeDefined();
    expect(trpcService.authenticatedShortProcedure).toBeDefined();
    expect(trpcService.authenticatedMediumProcedure).toBeDefined();
  });

  it("should have utility methods", () => {
    expect(trpcService.router).toBeDefined();
    expect(trpcService.middleware).toBeDefined();
    expect(trpcService.mergeRouters).toBeDefined();
    expect(trpcService.createCustomRateLimit).toBeDefined();
  });

  it("should create custom rate limit middleware", () => {
    const customRateLimit = trpcService.createCustomRateLimit(
      "SHORT",
      "Custom message",
    );

    expect(customRateLimit).toBeDefined();
  });

  it("should create custom rate limit with default message", () => {
    const customRateLimit = trpcService.createCustomRateLimit("MEDIUM");

    expect(customRateLimit).toBeDefined();
  });
});

describe("createContext", () => {
  it("should create context from express request and response", () => {
    const mockReq = { headers: {}, path: "/test" } as any;
    const mockRes = { setHeader: jest.fn() } as any;
    const mockInfo = {} as any;

    const context = createContext({
      req: mockReq,
      res: mockRes,
      info: mockInfo,
    });

    expect(context).toEqual({
      req: mockReq,
      res: mockRes,
    });
  });

  it("should handle empty request and response", () => {
    const mockReq = {} as any;
    const mockRes = {} as any;
    const mockInfo = {} as any;

    const context = createContext({
      req: mockReq,
      res: mockRes,
      info: mockInfo,
    });

    expect(context).toEqual({
      req: mockReq,
      res: mockRes,
    });
  });
});
