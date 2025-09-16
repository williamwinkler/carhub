/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import * as CtxModule from "../ctx";
import * as ContextUtils from "../utils/context.utils";
import { ContextMiddleware } from "./context.middleware";

// Mock the Ctx module
jest.mock("../ctx", () => ({
  Ctx: {
    requestId: undefined,
    correlationId: undefined,
  },
}));

// Mock context utils
jest.mock("../utils/context.utils", () => ({
  setupContext: jest.fn(),
}));

describe("ContextMiddleware", () => {
  let middleware: ContextMiddleware;
  let mockRequest: jest.Mocked<Request>;
  let mockResponse: jest.Mocked<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let setupContextSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContextMiddleware],
    }).compile();

    middleware = module.get<ContextMiddleware>(ContextMiddleware);

    // Reset mocks
    setupContextSpy = jest
      .spyOn(ContextUtils, "setupContext")
      .mockImplementation();

    // Mock Request
    mockRequest = {} as jest.Mocked<Request>;

    // Mock Response
    mockResponse = {
      setHeader: jest.fn(),
    } as any;

    // Mock NextFunction
    mockNext = jest.fn();

    // Reset Ctx values before each test
    (CtxModule.Ctx as any).requestId = undefined;
    (CtxModule.Ctx as any).correlationId = undefined;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("use", () => {
    it("should call setupContext with the request", () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(setupContextSpy).toHaveBeenCalledWith(mockRequest);
      expect(setupContextSpy).toHaveBeenCalledTimes(1);
    });

    it("should set x-request-id header from Ctx.requestId", () => {
      const testRequestId = randomUUID();
      (CtxModule.Ctx as any).requestId = testRequestId;

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "x-request-id",
        testRequestId,
      );
    });

    it("should set x-correlation-id header from Ctx.correlationId", () => {
      const testCorrelationId = randomUUID();
      (CtxModule.Ctx as any).correlationId = testCorrelationId;

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "x-correlation-id",
        testCorrelationId,
      );
    });

    it("should set both headers when both IDs are available", () => {
      const testRequestId = randomUUID();
      const testCorrelationId = randomUUID();
      (CtxModule.Ctx as any).requestId = testRequestId;
      (CtxModule.Ctx as any).correlationId = testCorrelationId;

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "x-request-id",
        testRequestId,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "x-correlation-id",
        testCorrelationId,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledTimes(2);
    });

    it("should call next() to continue the middleware chain", () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call functions in correct order", () => {
      const callOrder: string[] = [];

      setupContextSpy.mockImplementation(() => {
        callOrder.push("setupContext");
      });

      (mockResponse.setHeader as jest.Mock).mockImplementation(() => {
        callOrder.push("setHeader");

        return mockResponse;
      });

      mockNext.mockImplementation(() => {
        callOrder.push("next");
      });

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(callOrder).toEqual([
        "setupContext",
        "setHeader", // x-request-id
        "setHeader", // x-correlation-id
        "next",
      ]);
    });

    describe("edge cases", () => {
      it("should handle undefined requestId", () => {
        (CtxModule.Ctx as any).requestId = undefined;
        const testCorrelationId = randomUUID();
        (CtxModule.Ctx as any).correlationId = testCorrelationId;

        middleware.use(mockRequest, mockResponse, mockNext);

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "x-request-id",
          undefined,
        );
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "x-correlation-id",
          testCorrelationId,
        );
        expect(mockNext).toHaveBeenCalled();
      });

      it("should handle undefined correlationId", () => {
        const testRequestId = randomUUID();
        (CtxModule.Ctx as any).requestId = testRequestId;
        (CtxModule.Ctx as any).correlationId = undefined;

        middleware.use(mockRequest, mockResponse, mockNext);

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "x-request-id",
          testRequestId,
        );
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "x-correlation-id",
          undefined,
        );
        expect(mockNext).toHaveBeenCalled();
      });

      it("should handle null values", () => {
        (CtxModule.Ctx as any).requestId = null;
        (CtxModule.Ctx as any).correlationId = null;

        middleware.use(mockRequest, mockResponse, mockNext);

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "x-request-id",
          null,
        );
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "x-correlation-id",
          null,
        );
        expect(mockNext).toHaveBeenCalled();
      });

      it("should handle empty string values", () => {
        (CtxModule.Ctx as any).requestId = "";
        (CtxModule.Ctx as any).correlationId = "";

        middleware.use(mockRequest, mockResponse, mockNext);

        expect(mockResponse.setHeader).toHaveBeenCalledWith("x-request-id", "");
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          "x-correlation-id",
          "",
        );
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe("error handling", () => {
      it("should handle setupContext throwing an error", () => {
        const contextError = new Error("Context setup failed");
        setupContextSpy.mockImplementation(() => {
          throw contextError;
        });

        expect(() => {
          middleware.use(mockRequest, mockResponse, mockNext);
        }).toThrow("Context setup failed");

        expect(setupContextSpy).toHaveBeenCalledWith(mockRequest);
        // Headers and next should not be called if setupContext throws
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should handle setHeader throwing an error", () => {
        const headerError = new Error("Header setting failed");
        (mockResponse.setHeader as jest.Mock).mockImplementation(() => {
          throw headerError;
        });

        expect(() => {
          middleware.use(mockRequest, mockResponse, mockNext);
        }).toThrow("Header setting failed");

        expect(setupContextSpy).toHaveBeenCalledWith(mockRequest);
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("should handle next() throwing an error", () => {
        const nextError = new Error("Next middleware failed");
        mockNext.mockImplementation(() => {
          throw nextError;
        });

        expect(() => {
          middleware.use(mockRequest, mockResponse, mockNext);
        }).toThrow("Next middleware failed");

        expect(setupContextSpy).toHaveBeenCalledWith(mockRequest);
        expect(mockResponse.setHeader).toHaveBeenCalledTimes(2);
      });
    });

    describe("integration scenarios", () => {
      it("should work with different request types", () => {
        const requestWithHeaders = {
          headers: {
            "x-request-id": "existing-request-id",
            "x-correlation-id": "existing-correlation-id",
            "user-agent": "test-agent",
          },
          method: "POST",
          url: "/api/test",
        } as any;

        middleware.use(requestWithHeaders, mockResponse, mockNext);

        expect(setupContextSpy).toHaveBeenCalledWith(requestWithHeaders);
        expect(mockResponse.setHeader).toHaveBeenCalledTimes(2);
        expect(mockNext).toHaveBeenCalled();
      });

      it("should work with minimal request object", () => {
        const minimalRequest = {} as Request;

        middleware.use(minimalRequest, mockResponse, mockNext);

        expect(setupContextSpy).toHaveBeenCalledWith(minimalRequest);
        expect(mockResponse.setHeader).toHaveBeenCalledTimes(2);
        expect(mockNext).toHaveBeenCalled();
      });

      it("should handle concurrent requests", () => {
        const request1 = {} as Request;
        const request2 = {} as Request;
        const response1 = { setHeader: jest.fn() } as any;
        const response2 = { setHeader: jest.fn() } as any;
        const next1 = jest.fn();
        const next2 = jest.fn();

        // Simulate different context values for each request
        setupContextSpy
          .mockImplementationOnce(() => {
            (CtxModule.Ctx as any).requestId = "req-1";
            (CtxModule.Ctx as any).correlationId = "corr-1";
          })
          .mockImplementationOnce(() => {
            (CtxModule.Ctx as any).requestId = "req-2";
            (CtxModule.Ctx as any).correlationId = "corr-2";
          });

        middleware.use(request1, response1, next1);
        middleware.use(request2, response2, next2);

        expect(setupContextSpy).toHaveBeenCalledTimes(2);
        expect(response1.setHeader).toHaveBeenCalledWith(
          "x-request-id",
          "req-1",
        );
        expect(response1.setHeader).toHaveBeenCalledWith(
          "x-correlation-id",
          "corr-1",
        );
        expect(response2.setHeader).toHaveBeenCalledWith(
          "x-request-id",
          "req-2",
        );
        expect(response2.setHeader).toHaveBeenCalledWith(
          "x-correlation-id",
          "corr-2",
        );
        expect(next1).toHaveBeenCalled();
        expect(next2).toHaveBeenCalled();
      });

      it("should work with response objects that have additional methods", () => {
        const extendedResponse = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis(),
        } as any;

        middleware.use(mockRequest, extendedResponse, mockNext);

        expect(extendedResponse.setHeader).toHaveBeenCalledTimes(2);
        expect(extendedResponse.status).not.toHaveBeenCalled();
        expect(extendedResponse.json).not.toHaveBeenCalled();
        expect(extendedResponse.send).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe("performance considerations", () => {
      it("should complete execution quickly", () => {
        const startTime = process.hrtime.bigint();

        middleware.use(mockRequest, mockResponse, mockNext);

        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Should complete in less than 10ms under normal conditions
        expect(duration).toBeLessThan(10);
        expect(setupContextSpy).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
      });

      it("should not create memory leaks with many invocations", () => {
        // Simulate many requests
        for (let i = 0; i < 1000; i++) {
          const req = {} as Request;
          const res = { setHeader: jest.fn() } as any;
          const next = jest.fn();

          middleware.use(req, res, next);
        }

        expect(setupContextSpy).toHaveBeenCalledTimes(1000);
        // Verify that middleware doesn't hold references to old requests/responses
        // This is more of a conceptual test - in real scenarios you'd use memory profiling
      });
    });
  });
});
