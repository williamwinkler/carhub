/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import type { ThrottlerRequest } from "@nestjs/throttler";
import { randomUUID } from "crypto";
import * as CtxModule from "@api/common/ctx";
import { CustomThrottlerGuard } from "@api/common/guards/throttler.guard";

// Mock the Ctx module
jest.mock("@api/common/ctx", () => ({
  Ctx: {
    userId: undefined,
  },
}));

// Mock the parent ThrottlerGuard
jest.mock("@nestjs/throttler", () => ({
  ThrottlerGuard: class MockThrottlerGuard {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async getTracker(req: ThrottlerRequest): Promise<string> {
      return "base-tracker";
    }
  },
  ThrottlerRequest: class MockThrottlerRequest {},
}));

describe("CustomThrottlerGuard", () => {
  let guard: CustomThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomThrottlerGuard],
    }).compile();

    guard = module.get<CustomThrottlerGuard>(CustomThrottlerGuard);

    // Reset Ctx.userId before each test
    (CtxModule.Ctx as any).userId = undefined;
  });

  describe("getTracker", () => {
    describe("authenticated users", () => {
      it("should return user-based tracker when user is authenticated", async () => {
        const userId = randomUUID();
        (CtxModule.Ctx as any).userId = userId;

        const mockRequest = {} as ThrottlerRequest;
        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe(`user:${userId}`);
      });

      it("should handle different user ID formats", async () => {
        const userId = "custom-user-id-123";
        (CtxModule.Ctx as any).userId = userId;

        const mockRequest = {} as ThrottlerRequest;
        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe(`user:${userId}`);
      });
    });

    describe("unauthenticated users", () => {
      it("should return IP-based tracker when user is not authenticated", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {
          ip: "192.168.1.100",
        } as ThrottlerRequest & { ip: string };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("192.168.1.100");
      });

      it("should fallback to socket remote address when IP is not available", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {
          socket: {
            remoteAddress: "10.0.0.1",
          },
        } as ThrottlerRequest & { socket: { remoteAddress: string } };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("10.0.0.1");
      });

      it("should return 'unknown' when neither IP nor socket address is available", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {} as ThrottlerRequest;

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("unknown");
      });

      it("should prefer IP over socket remote address when both are available", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {
          ip: "192.168.1.100",
          socket: {
            remoteAddress: "10.0.0.1",
          },
        } as ThrottlerRequest & {
          ip: string;
          socket: { remoteAddress: string };
        };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("192.168.1.100");
      });
    });

    describe("edge cases", () => {
      it("should handle null userId", async () => {
        (CtxModule.Ctx as any).userId = null;

        const mockRequest = {
          ip: "192.168.1.100",
        } as ThrottlerRequest & { ip: string };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("192.168.1.100");
      });

      it("should handle empty string userId", async () => {
        (CtxModule.Ctx as any).userId = "";

        const mockRequest = {
          ip: "192.168.1.100",
        } as ThrottlerRequest & { ip: string };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("192.168.1.100");
      });

      it("should handle whitespace-only userId", async () => {
        (CtxModule.Ctx as any).userId = "   ";

        const mockRequest = {} as ThrottlerRequest;
        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("user:   ");
      });

      it("should handle empty string IP", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {
          ip: "",
          socket: {
            remoteAddress: "10.0.0.1",
          },
        } as ThrottlerRequest & {
          ip: string;
          socket: { remoteAddress: string };
        };

        const result = await (guard as any).getTracker(mockRequest);

        // Empty string is truthy for nullish coalescing (??), so it should return empty string
        expect(result).toBe("");
      });

      it("should handle null IP and socket", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {
          ip: null,
          socket: null,
        } as ThrottlerRequest & {
          ip: null;
          socket: null;
        };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("unknown");
      });

      it("should handle IPv6 addresses", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {
          ip: "2001:db8::1",
        } as ThrottlerRequest & { ip: string };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("2001:db8::1");
      });

      it("should handle localhost addresses", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {
          ip: "127.0.0.1",
        } as ThrottlerRequest & { ip: string };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("127.0.0.1");
      });
    });

    describe("priority testing", () => {
      it("should prioritize user ID over IP when user is authenticated", async () => {
        const userId = randomUUID();
        (CtxModule.Ctx as any).userId = userId;

        const mockRequest = {
          ip: "192.168.1.100",
          socket: {
            remoteAddress: "10.0.0.1",
          },
        } as ThrottlerRequest & {
          ip: string;
          socket: { remoteAddress: string };
        };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe(`user:${userId}`);
      });

      it("should not fallback to IP when authenticated user ID exists", async () => {
        const userId = "test-user-123";
        (CtxModule.Ctx as any).userId = userId;

        const mockRequest = {
          ip: "192.168.1.100",
        } as ThrottlerRequest & { ip: string };

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).not.toBe("192.168.1.100");
        expect(result).toBe(`user:${userId}`);
      });
    });

    describe("realistic scenarios", () => {
      it("should handle Express.js request object format", async () => {
        (CtxModule.Ctx as any).userId = undefined;

        const mockRequest = {
          ip: "203.0.113.1",
          socket: {
            remoteAddress: "203.0.113.1",
          },
          headers: {
            "x-forwarded-for": "203.0.113.1, 198.51.100.1",
          },
        } as any;

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe("203.0.113.1");
      });

      it("should handle rate limiting for API endpoints", async () => {
        const apiUserId = randomUUID();
        (CtxModule.Ctx as any).userId = apiUserId;

        const mockRequest = {
          url: "/api/v1/cars",
          method: "GET",
        } as any;

        const result = await (guard as any).getTracker(mockRequest);

        expect(result).toBe(`user:${apiUserId}`);
      });
    });
  });
});
