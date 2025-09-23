/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { randomUUID } from 'crypto';

import { AppModule } from '@api/app.module';
import { User } from '@api/modules/users/entities/user.entity';
import { Car } from '@api/modules/cars/entities/car.entity';
import { CarModel } from '@api/modules/car-models/entities/car-model.entity';
import { CarManufacturer } from '@api/modules/car-manufacturers/entities/car-manufacturer.entity';
import { AuthService } from '@api/modules/auth/auth.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { HttpErrorFilter } from '@api/common/filters/http-error.filter';
import { ResponseWrapperInterceptor } from '@api/common/interceptors/response-wrapper.interceptor';
import { createUserFactory, createAdminUserFactory } from '@api/test/factories/user.factory';
import { createCarFactory } from '@api/test/factories/car.factory';
import { getTestDataSource } from '@api/test/helpers/database-setup';

describe('Cars (E2E)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersRepo: Repository<User>;
  let carsRepo: Repository<Car>;
  let modelsRepo: Repository<CarModel>;
  let brandsRepo: Repository<CarManufacturer>;
  let dataSource: DataSource;

  let testUser: User;
  let testAdmin: User;
  let testBrand: CarManufacturer;
  let testModel: CarModel;
  let userAccessToken: string;
  let adminAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same global config as main.ts
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new HttpErrorFilter());
    app.useGlobalInterceptors(new ResponseWrapperInterceptor());

    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    usersRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    carsRepo = moduleFixture.get<Repository<Car>>(getRepositoryToken(Car));
    modelsRepo = moduleFixture.get<Repository<CarModel>>(getRepositoryToken(CarModel));
    brandsRepo = moduleFixture.get<Repository<CarManufacturer>>(getRepositoryToken(CarManufacturer));
    dataSource = await getTestDataSource();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create test users
    const password = 'TestPassword123!';
    const hashedPassword = await authService.hashPassword(password);

    testUser = usersRepo.create(createUserFactory({ password: hashedPassword }));
    await usersRepo.save(testUser);

    testAdmin = usersRepo.create(createAdminUserFactory({ password: hashedPassword }));
    await usersRepo.save(testAdmin);

    // Create test brand and model
    testBrand = brandsRepo.create({ name: 'Toyota' });
    await brandsRepo.save(testBrand);

    testModel = modelsRepo.create({
      name: 'Camry',
      manufacturer: testBrand,
    });
    await modelsRepo.save(testModel);

    // Get access tokens
    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: testUser.username,
        password,
      });
    userAccessToken = userLoginResponse.body.data.accessToken;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: testAdmin.username,
        password,
      });
    adminAccessToken = adminLoginResponse.body.data.accessToken;
  });

  describe('POST /cars', () => {
    it('should create a car successfully', async () => {
      const createCarDto = {
        modelId: testModel.id,
        year: 2023,
        color: 'Blue',
        kmDriven: 5000,
        price: 25000,
      };

      const response = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(createCarDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          year: createCarDto.year,
          color: createCarDto.color,
          kmDriven: createCarDto.kmDriven,
          price: createCarDto.price,
          createdBy: testUser.id,
        },
        message: expect.any(String),
      });

      // Verify in database
      const car = await carsRepo.findOne({
        where: { id: response.body.data.id },
      });
      expect(car).toBeDefined();
    });

    it('should reject creation without authentication', async () => {
      const createCarDto = {
        modelId: testModel.id,
        year: 2023,
        color: 'Blue',
        kmDriven: 5000,
        price: 25000,
      };

      const response = await request(app.getHttpServer())
        .post('/cars')
        .send(createCarDto)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject creation with invalid data', async () => {
      const invalidDto = {
        modelId: 'invalid-uuid',
        year: 1800, // Too old
        color: '', // Empty
        kmDriven: -100, // Negative
        price: -1000, // Negative
      };

      const response = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject creation with non-existent model', async () => {
      const createCarDto = {
        modelId: randomUUID(),
        year: 2023,
        color: 'Blue',
        kmDriven: 5000,
        price: 25000,
      };

      const response = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(createCarDto)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /cars', () => {
    beforeEach(async () => {
      // Create test cars
      const cars = [
        createCarFactory({ ownerId: testUser.id, year: 2020 }),
        createCarFactory({ ownerId: testUser.id, year: 2023 }),
        createCarFactory({ ownerId: testAdmin.id, year: 2024 }),
      ];

      for (const carData of cars) {
        const car = carsRepo.create(carData);
        car.model = testModel;
        await carsRepo.save(car);
      }
    });

    it('should get all cars with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/cars')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          data: expect.any(Array),
          total: expect.any(Number),
          page: 1,
          limit: 2,
          totalPages: expect.any(Number),
        },
      });

      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('should filter cars by year range', async () => {
      const response = await request(app.getHttpServer())
        .get('/cars')
        .query({ minYear: 2022, maxYear: 2024 })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.data.forEach((car: any) => {
        expect(car.year).toBeGreaterThanOrEqual(2022);
        expect(car.year).toBeLessThanOrEqual(2024);
      });
    });

    it('should filter cars by brand', async () => {
      const response = await request(app.getHttpServer())
        .get('/cars')
        .query({ brand: 'Toyota' })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.data.forEach((car: any) => {
        expect(car.model.manufacturer.name).toBe('Toyota');
      });
    });
  });

  describe('GET /cars/:id', () => {
    let testCar: Car;

    beforeEach(async () => {
      testCar = carsRepo.create(createCarFactory({
        ownerId: testUser.id,
      }));
      testCar.model = testModel;
      testCar = await carsRepo.save(testCar);
    });

    it('should get car by id successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cars/${testCar.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testCar.id,
          year: testCar.year,
          color: testCar.color,
          model: {
            id: testModel.id,
            name: testModel.name,
            manufacturer: {
              name: testBrand.name,
            },
          },
        },
      });
    });

    it('should return 404 for non-existent car', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cars/${randomUUID()}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /cars/:id', () => {
    let testCar: Car;

    beforeEach(async () => {
      testCar = carsRepo.create(createCarFactory({
        ownerId: testUser.id,
      }));
      testCar.model = testModel;
      testCar = await carsRepo.save(testCar);
    });

    it('should update own car successfully', async () => {
      const updateDto = {
        year: 2024,
        color: 'Red',
        price: 30000,
      };

      const response = await request(app.getHttpServer())
        .put(`/cars/${testCar.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testCar.id,
          year: updateDto.year,
          color: updateDto.color,
          price: updateDto.price,
        },
      });

      // Verify in database
      const updatedCar = await carsRepo.findOne({
        where: { id: testCar.id },
      });
      expect(updatedCar!.year).toBe(updateDto.year);
      expect(updatedCar!.color).toBe(updateDto.color);
      expect(updatedCar!.price).toBe(updateDto.price);
    });

    it('should reject update without authentication', async () => {
      const updateDto = {
        year: 2024,
      };

      const response = await request(app.getHttpServer())
        .put(`/cars/${testCar.id}`)
        .send(updateDto)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update of other user car', async () => {
      const otherUserCar = carsRepo.create(createCarFactory({
        ownerId: testAdmin.id,
      }));
      otherUserCar.model = testModel;
      const savedOtherCar = await carsRepo.save(otherUserCar);

      const updateDto = {
        year: 2024,
      };

      const response = await request(app.getHttpServer())
        .put(`/cars/${savedOtherCar.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateDto)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to update any car', async () => {
      const updateDto = {
        year: 2024,
        color: 'Green',
      };

      const response = await request(app.getHttpServer())
        .put(`/cars/${testCar.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.year).toBe(updateDto.year);
      expect(response.body.data.color).toBe(updateDto.color);
    });
  });

  describe('DELETE /cars/:id', () => {
    let testCar: Car;

    beforeEach(async () => {
      testCar = carsRepo.create(createCarFactory({
        ownerId: testUser.id,
      }));
      testCar.model = testModel;
      testCar = await carsRepo.save(testCar);
    });

    it('should delete own car successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/cars/${testCar.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify soft delete in database
      const deletedCar = await carsRepo.findOne({
        where: { id: testCar.id },
      });
      expect(deletedCar).toBeNull();

      const deletedCarWithDeleted = await carsRepo.findOne({
        where: { id: testCar.id },
        withDeleted: true,
      });
      expect(deletedCarWithDeleted).toBeDefined();
      expect(deletedCarWithDeleted!.deletedAt).toBeDefined();
    });

    it('should reject delete without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/cars/${testCar.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject delete of other user car', async () => {
      const otherUserCar = carsRepo.create(createCarFactory({
        ownerId: testAdmin.id,
      }));
      otherUserCar.model = testModel;
      const savedOtherCar = await carsRepo.save(otherUserCar);

      const response = await request(app.getHttpServer())
        .delete(`/cars/${savedOtherCar.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to delete any car', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/cars/${testCar.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent car', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/cars/${randomUUID()}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error handling and validation', () => {
    it('should handle malformed UUID parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/cars/not-a-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/cars')
        .query({
          page: 'not-a-number',
          limit: -1,
          minYear: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});