import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { of } from "rxjs";
import { ResponseWrapperInterceptor } from "@api/common/interceptors/response-wrapper.interceptor";

// Mock package.json
jest.mock("@api/../package.json", () => ({
  version: "1.2.3",
}));

describe("ResponseWrapperInterceptor", () => {
  let interceptor: ResponseWrapperInterceptor<any>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  const mockUserData = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseWrapperInterceptor],
    }).compile();

    interceptor = module.get<ResponseWrapperInterceptor<any>>(
      ResponseWrapperInterceptor,
    );

    mockExecutionContext = {
      switchToHttp: jest.fn(),
      getHandler: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  it("should be defined", () => {
    expect(interceptor).toBeDefined();
  });

  describe("intercept", () => {
    it("should wrap response with apiVersion", (done) => {
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

    it("should handle array data", (done) => {
      const arrayData = [mockUserData, { ...mockUserData, id: 2 }];
      mockCallHandler.handle.mockReturnValue(of(arrayData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (response) => {
          expect(response).toEqual({
            apiVersion: "1.2.3",
            data: arrayData,
          });
          done();
        },
      });
    });

    it("should preserve apiVersion from package.json", (done) => {
      mockCallHandler.handle.mockReturnValue(of(mockUserData));

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
  });
});
