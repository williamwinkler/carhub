/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { HttpException, HttpStatus } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { Request, Response } from "express";
import { Observable, of, throwError } from "rxjs";
import { TrafficInterceptor } from "@api/common/interceptors/traffic.interceptor";

describe("TrafficInterceptor", () => {
  let interceptor: TrafficInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: jest.Mocked<Request>;
  let mockResponse: jest.Mocked<Response>;
  let loggerDebugSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrafficInterceptor],
    }).compile();

    interceptor = module.get<TrafficInterceptor>(TrafficInterceptor);

    // Mock Logger - spy on the interceptor's logger instance
    loggerDebugSpy = jest
      .spyOn((interceptor as any).logger, "debug")
      .mockImplementation();

    // Mock Request
    mockRequest = {
      url: "/api/test",
      method: "GET",
    } as jest.Mocked<Request>;

    // Mock Response
    mockResponse = {
      statusCode: 200,
    } as jest.Mocked<Response>;

    // Mock ExecutionContext
    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getNext: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
    } as jest.Mocked<ExecutionContext>;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as jest.Mocked<CallHandler>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("intercept", () => {
    describe("successful requests", () => {
      it("should log request with response status code and duration", (done) => {
        const responseData = { success: true };
        mockCallHandler.handle.mockReturnValue(of(responseData));
        mockResponse.statusCode = 200;

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (data) => {
            expect(data).toEqual(responseData);
          },
          complete: () => {
            // Add a small delay to ensure finalize has executed
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringMatching(
                  /GET \/api\/test \| Status: 200 \| Duration: \d+ms/,
                ),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle different HTTP methods", (done) => {
        mockRequest.method = "POST";
        mockRequest.url = "/api/users";
        mockCallHandler.handle.mockReturnValue(of({ id: 1 }));
        mockResponse.statusCode = 201;

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringMatching(
                  /POST \/api\/users \| Status: 201 \| Duration: \d+ms/,
                ),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle different URLs and status codes", (done) => {
        mockRequest.url = "/api/cars/123";
        mockRequest.method = "PUT";
        mockCallHandler.handle.mockReturnValue(of({}));
        mockResponse.statusCode = 204;

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringMatching(
                  /PUT \/api\/cars\/123 \| Status: 204 \| Duration: \d+ms/,
                ),
              );
              done();
            }, 0);
          },
        });
      });

      it("should measure actual duration time", (done) => {
        const startTime = Date.now();
        jest
          .spyOn(Date, "now")
          .mockReturnValueOnce(startTime)
          .mockReturnValueOnce(startTime + 150);

        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Duration: 150ms"),
              );
              done();
            }, 0);
          },
        });
      });
    });

    describe("HTTP exceptions", () => {
      it("should log error status code when HttpException is thrown", (done) => {
        const httpError = new HttpException(
          "Bad Request",
          HttpStatus.BAD_REQUEST,
        );
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(httpError);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringMatching(
                  /GET \/api\/test \| Status: 400 \| Duration: \d+ms/,
                ),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle different HTTP error status codes", (done) => {
        const notFoundError = new HttpException(
          "Not Found",
          HttpStatus.NOT_FOUND,
        );
        mockCallHandler.handle.mockReturnValue(throwError(() => notFoundError));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(notFoundError);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Status: 404"),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle unauthorized error", (done) => {
        const unauthorizedError = new HttpException(
          "Unauthorized",
          HttpStatus.UNAUTHORIZED,
        );
        mockCallHandler.handle.mockReturnValue(
          throwError(() => unauthorizedError),
        );

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(unauthorizedError);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Status: 401"),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle internal server error", (done) => {
        const serverError = new HttpException(
          "Internal Server Error",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
        mockCallHandler.handle.mockReturnValue(throwError(() => serverError));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(serverError);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Status: 500"),
              );
              done();
            }, 0);
          },
        });
      });

      it("should re-throw HttpException after logging", (done) => {
        const httpError = new HttpException("Forbidden", HttpStatus.FORBIDDEN);
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(httpError);
            expect(err.getStatus()).toBe(HttpStatus.FORBIDDEN);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalled();
              done();
            }, 0);
          },
        });
      });
    });

    describe("non-HTTP exceptions", () => {
      it("should use status code 500 for non-HttpException errors", (done) => {
        const genericError = new Error("Unexpected error");
        mockCallHandler.handle.mockReturnValue(throwError(() => genericError));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(genericError);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Status: 500"),
              );
              done();
            }, 0);
          },
        });
      });

      it("should re-throw non-HttpException errors", (done) => {
        const typeError = new TypeError("Type mismatch");
        mockCallHandler.handle.mockReturnValue(throwError(() => typeError));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(typeError);
            expect(err instanceof TypeError).toBe(true);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalled();
              done();
            }, 0);
          },
        });
      });

      it("should handle null/undefined errors", (done) => {
        mockCallHandler.handle.mockReturnValue(throwError(() => null));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(null);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Status: 500"),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle string errors", (done) => {
        const stringError = "Something went wrong";
        mockCallHandler.handle.mockReturnValue(throwError(() => stringError));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (err) => {
            expect(err).toBe(stringError);
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Status: 500"),
              );
              done();
            }, 0);
          },
        });
      });
    });

    describe("edge cases", () => {
      it("should handle empty URL", (done) => {
        mockRequest.url = "";
        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringMatching(/GET  \| Status: 200 \| Duration: \d+ms/),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle URL with query parameters", (done) => {
        mockRequest.url = "/api/users?page=1&limit=10";
        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("GET /api/users?page=1&limit=10"),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle long URLs", (done) => {
        const longUrl =
          "/api/very/long/path/with/many/segments/and/parameters?param1=value1&param2=value2&param3=value3";
        mockRequest.url = longUrl;
        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining(`GET ${longUrl}`),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle zero duration", (done) => {
        const currentTime = 1000;
        jest.spyOn(Date, "now").mockReturnValue(currentTime);

        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Duration: 0ms"),
              );
              done();
            }, 0);
          },
        });
      });

      it("should handle response status code 0", (done) => {
        mockResponse.statusCode = 0;
        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Status: 0"),
              );
              done();
            }, 0);
          },
        });
      });

      it("should prefer error status code over response status code when error occurs", (done) => {
        mockResponse.statusCode = 200;
        const conflictError = new HttpException(
          "Conflict",
          HttpStatus.CONFLICT,
        );
        mockCallHandler.handle.mockReturnValue(throwError(() => conflictError));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Status: 409"),
              );
              expect(loggerDebugSpy).not.toHaveBeenCalledWith(
                expect.stringContaining("Status: 200"),
              );
              done();
            }, 0);
          },
        });
      });
    });

    describe("logger configuration", () => {
      it("should use 'API' as logger context", () => {
        const logger = (interceptor as any).logger;
        expect(logger.context).toBe("API");
      });

      it("should call logger.debug with correct message format", (done) => {
        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          complete: () => {
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledTimes(1);
              expect(loggerDebugSpy).toHaveBeenCalledWith(
                expect.stringMatching(
                  /^[A-Z]+ .+ \| Status: \d+ \| Duration: \d+ms$/,
                ),
              );
              done();
            }, 0);
          },
        });
      });
    });

    describe("observable behavior", () => {
      it("should return the same observable data", (done) => {
        const testData = { id: 123, name: "test" };
        mockCallHandler.handle.mockReturnValue(of(testData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (data) => {
            expect(data).toEqual(testData);
            done();
          },
        });
      });

      it("should not modify observable data", (done) => {
        const complexData = {
          users: [
            { id: 1, name: "John" },
            { id: 2, name: "Jane" },
          ],
          metadata: { total: 2, page: 1 },
        };
        mockCallHandler.handle.mockReturnValue(of(complexData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (data) => {
            expect(data).toEqual(complexData);
            expect(data).toBe(complexData); // Should be the exact same reference
            done();
          },
        });
      });

      it("should handle multiple emissions", (done) => {
        const observable = new Observable((subscriber) => {
          subscriber.next("first");
          subscriber.next("second");
          subscriber.complete();
        });
        mockCallHandler.handle.mockReturnValue(observable);

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );
        const emissions: string[] = [];

        result$.subscribe({
          next: (data) => {
            emissions.push(data as string);
          },
          complete: () => {
            expect(emissions).toEqual(["first", "second"]);
            // Should only log once on completion
            setTimeout(() => {
              expect(loggerDebugSpy).toHaveBeenCalledTimes(1);
              done();
            }, 0);
          },
        });
      });
    });
  });
});
