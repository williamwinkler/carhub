/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { CarsController } from "@api/modules/cars/cars.controller";
import { CarsService } from "@api/modules/cars/cars.service";
import { CarsAdapter } from "@api/modules/cars/cars.adapter";

// Mock the Ctx module
jest.mock("@api/common/ctx", () => ({
  Ctx: {
    userIdRequired: jest.fn(),
    principalRequired: jest.fn(),
    roleRequired: jest.fn(),
  },
}));

// Mock the CarsService since we're just testing the integration
const mockCarsService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  toggleFavoriteForUser: jest.fn(),
  getFavoritesByUser: jest.fn(),
};

describe("Cars HTTP Integration Tests", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CarsController],
      providers: [
        { provide: CarsService, useValue: mockCarsService },
        CarsAdapter,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should bootstrap the module successfully", () => {
    expect(app).toBeDefined();
  });

  it("should have all required dependencies", () => {
    const controller = app.get(CarsController);
    const adapter = app.get(CarsAdapter);

    expect(controller).toBeDefined();
    expect(adapter).toBeDefined();
  });
});
