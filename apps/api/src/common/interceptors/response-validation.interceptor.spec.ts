/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { Request } from "express";
import { Observable, of } from "rxjs";
import z from "zod";
import { InternalServerError } from "../errors/domain/internal-server-error";
import type { ResponseDtoMeta } from "../utils/swagger.utils";
import { RESPONSE_DTO_KEY } from "../utils/swagger.utils";
import { ResponseValidationInterceptor } from "./response-validation.interceptor";

// Mock package.json
jest.mock("../../../package.json", () => ({
  version: "1.2.3",
}));

describe("ResponseValidationInterceptor", () => {
  let interceptor: ResponseValidationInterceptor<any>;
  let reflector: jest.Mocked<Reflector>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: jest.Mocked<Request>;
  let loggerErrorSpy: jest.SpyInstance;

  const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
  });

  const mockUserData = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseValidationInterceptor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<ResponseValidationInterceptor<any>>(
      ResponseValidationInterceptor,
    );
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;

    // Mock Logger
    loggerErrorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();

    // Mock Request
    mockRequest = {
      method: "GET",
      url: "/api/users/1",
    } as jest.Mocked<Request>;

    // Mock ExecutionContext
    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
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
    describe("without schema validation", () => {
      it("should wrap response without validation when no metadata", (done) => {
        reflector.get.mockReturnValue(undefined);
        mockCallHandler.handle.mockReturnValue(of(mockUserData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response).toEqual({
              apiVersion: "1.2.3",
              data: mockUserData,
            });
            expect(reflector.get).toHaveBeenCalledWith(
              RESPONSE_DTO_KEY,
              mockExecutionContext.getHandler(),
            );
            done();
          },
        });
      });

      it("should wrap response when metadata exists but no schema", (done) => {
        const mockMeta: ResponseDtoMeta = {
          classRef: class UserDto {},
          isList: false,
          schema: undefined,
        };
        reflector.get.mockReturnValue(mockMeta);
        mockCallHandler.handle.mockReturnValue(of(mockUserData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response).toEqual({
              apiVersion: "1.2.3",
              data: mockUserData,
            });
            done();
          },
        });
      });

      it("should handle null data", (done) => {
        reflector.get.mockReturnValue(undefined);
        mockCallHandler.handle.mockReturnValue(of(null));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response).toEqual({
              apiVersion: "1.2.3",
              data: null,
            });
            done();
          },
        });
      });

      it("should handle undefined data", (done) => {
        reflector.get.mockReturnValue(undefined);
        mockCallHandler.handle.mockReturnValue(of(undefined));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response).toEqual({
              apiVersion: "1.2.3",
              data: undefined,
            });
            done();
          },
        });
      });
    });

    describe("with single item schema validation", () => {
      const mockMeta: ResponseDtoMeta = {
        classRef: class UserDto {
          name = "UserDto";
        },
        isList: false,
        schema: userSchema,
      };

      it("should validate and wrap valid single item response", (done) => {
        reflector.get.mockReturnValue(mockMeta);
        mockCallHandler.handle.mockReturnValue(of(mockUserData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response).toEqual({
              apiVersion: "1.2.3",
              data: mockUserData,
            });
            done();
          },
        });
      });

      it("should throw InternalServerError for invalid single item data", () => {
        reflector.get.mockReturnValue(mockMeta);
        const invalidData = { id: "invalid", name: 123 }; // invalid types
        mockCallHandler.handle.mockReturnValue(of(invalidData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(InternalServerError);
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringMatching(
                /Outgoing response validation failed for schema UserDto at GET \/api\/users\/1:/,
              ),
            );
          },
        });
      });

      it("should handle missing required fields", () => {
        reflector.get.mockReturnValue(mockMeta);
        const incompleteData = { id: 1 }; // missing name and email
        mockCallHandler.handle.mockReturnValue(of(incompleteData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(InternalServerError);
            expect(loggerErrorSpy).toHaveBeenCalled();
          },
        });
      });

      it("should handle extra fields in data", (done) => {
        reflector.get.mockReturnValue(mockMeta);
        const dataWithExtra = {
          ...mockUserData,
          extraField: "should be ignored",
        };
        mockCallHandler.handle.mockReturnValue(of(dataWithExtra));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response.data).toEqual(mockUserData); // extra field stripped by zod
            done();
          },
        });
      });
    });

    describe("with list schema validation", () => {
      const mockListMeta: ResponseDtoMeta = {
        classRef: class UserDto {
          name = "UserDto";
        },
        isList: true,
        schema: userSchema,
      };

      it("should validate and wrap valid list response", (done) => {
        reflector.get.mockReturnValue(mockListMeta);
        const paginatedData = {
          items: [mockUserData, { ...mockUserData, id: 2, name: "Jane Doe" }],
          total: 2,
          page: 1,
          limit: 10,
        };
        mockCallHandler.handle.mockReturnValue(of(paginatedData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response).toEqual({
              apiVersion: "1.2.3",
              data: paginatedData,
            });
            done();
          },
        });
      });

      it("should throw InternalServerError for invalid list items", () => {
        reflector.get.mockReturnValue(mockListMeta);
        const invalidPaginatedData = {
          items: [mockUserData, { id: "invalid", name: 123 }],
          total: 2,
          page: 1,
          limit: 10,
        };
        mockCallHandler.handle.mockReturnValue(of(invalidPaginatedData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(InternalServerError);
            expect(loggerErrorSpy).toHaveBeenCalled();
          },
        });
      });

      it("should handle empty list", (done) => {
        reflector.get.mockReturnValue(mockListMeta);
        const emptyPaginatedData = {
          items: [],
          total: 0,
          page: 1,
          limit: 10,
        };
        mockCallHandler.handle.mockReturnValue(of(emptyPaginatedData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response).toEqual({
              apiVersion: "1.2.3",
              data: emptyPaginatedData,
            });
            done();
          },
        });
      });

      it("should validate each item in the list independently", () => {
        reflector.get.mockReturnValue(mockListMeta);
        const mixedValidData = {
          items: [
            mockUserData, // valid
            { id: 2, name: "Jane", email: "invalid-email" }, // invalid email
          ],
          total: 2,
        };
        mockCallHandler.handle.mockReturnValue(of(mixedValidData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(InternalServerError);
            expect(loggerErrorSpy).toHaveBeenCalled();
          },
        });
      });

      it("should handle list with null items", () => {
        reflector.get.mockReturnValue(mockListMeta);
        const dataWithNullItems = {
          items: [mockUserData, null],
          total: 2,
        };
        mockCallHandler.handle.mockReturnValue(of(dataWithNullItems));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(InternalServerError);
            expect(loggerErrorSpy).toHaveBeenCalled();
          },
        });
      });
    });

    describe("error handling and logging", () => {
      const mockMeta: ResponseDtoMeta = {
        classRef: class TestDto {
          name = "TestDto";
        },
        isList: false,
        schema: userSchema,
      };

      it("should log detailed validation error", () => {
        reflector.get.mockReturnValue(mockMeta);
        const invalidData = { id: "not-a-number" };
        mockCallHandler.handle.mockReturnValue(of(invalidData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: () => {
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringMatching(
                /Outgoing response validation failed for schema TestDto at GET \/api\/users\/1:/,
              ),
            );
          },
        });
      });

      it("should handle different HTTP methods in logs", () => {
        mockRequest.method = "POST";
        mockRequest.url = "/api/users";
        reflector.get.mockReturnValue(mockMeta);
        mockCallHandler.handle.mockReturnValue(of({ invalid: "data" }));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: () => {
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringContaining("POST /api/users"),
            );
          },
        });
      });

      it("should handle different URL formats in logs", () => {
        mockRequest.url = "/api/complex/path?param=value";
        reflector.get.mockReturnValue(mockMeta);
        mockCallHandler.handle.mockReturnValue(of({ invalid: "data" }));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: () => {
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringContaining("/api/complex/path?param=value"),
            );
          },
        });
      });

      it("should use UnknownDto when classRef has no name", () => {
        const metaWithoutName: ResponseDtoMeta = {
          classRef: class {}, // no name property
          isList: false,
          schema: userSchema,
        };
        reflector.get.mockReturnValue(metaWithoutName);
        mockCallHandler.handle.mockReturnValue(of({ invalid: "data" }));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: () => {
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringContaining("for schema"),
            );
          },
        });
      });

      it("should handle undefined classRef gracefully", () => {
        const metaWithUndefinedClass: ResponseDtoMeta = {
          classRef: undefined as any,
          isList: false,
          schema: userSchema,
        };
        reflector.get.mockReturnValue(metaWithUndefinedClass);
        mockCallHandler.handle.mockReturnValue(of({ invalid: "data" }));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: () => {
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringContaining("UnknownDto"),
            );
          },
        });
      });
    });

    describe("complex schema scenarios", () => {
      it("should handle nested object validation", (done) => {
        const nestedSchema = z.object({
          user: z.object({
            id: z.number(),
            profile: z.object({
              firstName: z.string(),
              lastName: z.string(),
            }),
          }),
          metadata: z.object({
            createdAt: z.string(),
          }),
        });

        const mockMeta: ResponseDtoMeta = {
          classRef: class NestedDto {
            name = "NestedDto";
          },
          isList: false,
          schema: nestedSchema,
        };

        reflector.get.mockReturnValue(mockMeta);
        const validNestedData = {
          user: {
            id: 1,
            profile: {
              firstName: "John",
              lastName: "Doe",
            },
          },
          metadata: {
            createdAt: "2023-01-01T00:00:00Z",
          },
        };
        mockCallHandler.handle.mockReturnValue(of(validNestedData));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response.data).toEqual(validNestedData);
            done();
          },
        });
      });

      it("should handle schema with transformations", (done) => {
        const transformSchema = z.object({
          id: z.number(),
          name: z.string().toLowerCase(),
          count: z.string().transform((val) => parseInt(val, 10)),
        });

        const mockMeta: ResponseDtoMeta = {
          classRef: class TransformDto {
            name = "TransformDto";
          },
          isList: false,
          schema: transformSchema,
        };

        reflector.get.mockReturnValue(mockMeta);
        const dataToTransform = {
          id: 1,
          name: "JOHN DOE",
          count: "42",
        };
        mockCallHandler.handle.mockReturnValue(of(dataToTransform));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response.data).toEqual({
              id: 1,
              name: "john doe",
              count: 42,
            });
            done();
          },
        });
      });

      it("should handle optional fields", (done) => {
        const optionalSchema = z.object({
          id: z.number(),
          name: z.string(),
          description: z.string().optional(),
        });

        const mockMeta: ResponseDtoMeta = {
          classRef: class OptionalDto {
            name = "OptionalDto";
          },
          isList: false,
          schema: optionalSchema,
        };

        reflector.get.mockReturnValue(mockMeta);
        const dataWithoutOptional = {
          id: 1,
          name: "Test",
        };
        mockCallHandler.handle.mockReturnValue(of(dataWithoutOptional));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response.data).toEqual(dataWithoutOptional);
            done();
          },
        });
      });
    });

    describe("edge cases", () => {
      it("should handle schema validation throwing non-Error objects", () => {
        const throwingSchema = z.custom(() => {
          throw "String error";
        });

        const mockMeta: ResponseDtoMeta = {
          classRef: class ThrowingDto {
            name = "ThrowingDto";
          },
          isList: false,
          schema: throwingSchema,
        };

        reflector.get.mockReturnValue(mockMeta);
        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(InternalServerError);
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringContaining("String error"),
            );
          },
        });
      });

      it("should handle very large datasets", (done) => {
        const mockMeta: ResponseDtoMeta = {
          classRef: class LargeDto {
            name = "LargeDto";
          },
          isList: true,
          schema: userSchema,
        };

        reflector.get.mockReturnValue(mockMeta);
        const largeDataset = {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
          })),
          total: 1000,
        };
        mockCallHandler.handle.mockReturnValue(of(largeDataset));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response.data.items).toHaveLength(1000);
            expect(response.data.total).toBe(1000);
            done();
          },
        });
      });

      it("should preserve apiVersion from package.json", (done) => {
        reflector.get.mockReturnValue(undefined);
        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          next: (response) => {
            expect(response.apiVersion).toBe("1.2.3");
            done();
          },
        });
      });

      it("should handle observable errors gracefully", () => {
        const observableError = new Observable((subscriber) => {
          subscriber.error(new Error("Observable error"));
        });

        reflector.get.mockReturnValue(undefined);
        mockCallHandler.handle.mockReturnValue(observableError);

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe({
          error: (error) => {
            expect(error.message).toBe("Observable error");
          },
        });
      });
    });

    describe("reflector interaction", () => {
      it("should call reflector with correct parameters", () => {
        const mockHandler = jest.fn();
        mockExecutionContext.getHandler.mockReturnValue(mockHandler);
        reflector.get.mockReturnValue(undefined);
        mockCallHandler.handle.mockReturnValue(of({}));

        const result$ = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result$.subscribe(() => {
          expect(reflector.get).toHaveBeenCalledWith(
            RESPONSE_DTO_KEY,
            mockHandler,
          );
          expect(mockExecutionContext.getHandler).toHaveBeenCalled();
        });
      });

      it("should handle reflector throwing errors", () => {
        mockExecutionContext.getHandler.mockImplementation(() => {
          throw new Error("Handler error");
        });

        expect(() => {
          interceptor.intercept(mockExecutionContext, mockCallHandler);
        }).toThrow("Handler error");
      });
    });
  });
});
