/* eslint-disable @typescript-eslint/no-explicit-any */
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";

import { AppModule } from "@api/app.module";
import { HttpErrorFilter } from "@api/common/filters/http-error.filter";
import { ResponseWrapperInterceptor } from "@api/common/interceptors/response-wrapper.interceptor";
import { AuthService } from "@api/modules/auth/auth.service";
import { User } from "@api/modules/users/entities/user.entity";
import { ZodValidationPipe } from "nestjs-zod";
import { createUserFactory } from "@api/test/factories/user.factory";
import { getTestDataSource } from "@api/test/helpers/database-setup";

describe("Auth (E2E)", () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersRepo: Repository<User>;
  let dataSource: DataSource;

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
    dataSource = await getTestDataSource();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const registerDto = {
        username: `user_${randomUUID().slice(0, 8)}`,
        firstName: "John",
        lastName: "Doe",
        password: "SecurePassword123!",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: expect.any(String),
            username: registerDto.username,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            role: "user",
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
        message: expect.any(String),
      });

      // Verify user exists in database
      const user = await usersRepo.findOne({
        where: { username: registerDto.username },
      });
      expect(user).toBeDefined();
      expect(user!.password).not.toBe(registerDto.password); // Should be hashed
    });

    it("should reject registration with invalid data", async () => {
      const invalidDto = {
        username: "", // Empty username
        firstName: "John",
        lastName: "Doe",
        password: "123", // Too short
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(invalidDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("should reject registration with duplicate username", async () => {
      const username = `user_${randomUUID().slice(0, 8)}`;

      // Create user first
      const user = usersRepo.create(createUserFactory({ username }));
      await usersRepo.save(user);

      const registerDto = {
        username,
        firstName: "Jane",
        lastName: "Doe",
        password: "SecurePassword123!",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /auth/login", () => {
    let testUser: User;
    const password = "TestPassword123!";

    beforeEach(async () => {
      const hashedPassword = await authService.hashPassword(password);
      testUser = usersRepo.create(
        createUserFactory({
          password: hashedPassword,
        }),
      );
      await usersRepo.save(testUser);
    });

    it("should login successfully with valid credentials", async () => {
      const loginDto = {
        username: testUser.username,
        password,
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: testUser.id,
            username: testUser.username,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role: testUser.role,
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
        message: expect.any(String),
      });
    });

    it("should reject login with invalid password", async () => {
      const loginDto = {
        username: testUser.username,
        password: "WrongPassword123!",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("should reject login with non-existent user", async () => {
      const loginDto = {
        username: "nonexistent_user",
        password: "SomePassword123!",
      };

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /auth/refresh", () => {
    let testUser: User;
    let refreshToken: string;

    beforeEach(async () => {
      const password = "TestPassword123!";
      const hashedPassword = await authService.hashPassword(password);
      testUser = usersRepo.create(
        createUserFactory({
          password: hashedPassword,
        }),
      );
      await usersRepo.save(testUser);

      // Get refresh token by logging in
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          username: testUser.username,
          password,
        });

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it("should refresh token successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
        message: expect.any(String),
      });

      // New tokens should be different
      expect(response.body.data.accessToken).not.toBe(refreshToken);
    });

    it("should reject refresh with invalid token", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "invalid_token" })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Authentication required endpoints", () => {
    let testUser: User;
    let accessToken: string;

    beforeEach(async () => {
      const password = "TestPassword123!";
      const hashedPassword = await authService.hashPassword(password);
      testUser = usersRepo.create(
        createUserFactory({
          password: hashedPassword,
        }),
      );
      await usersRepo.save(testUser);

      // Get access token
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          username: testUser.username,
          password,
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it("should access protected endpoint with valid token", async () => {
      const response = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
    });

    it("should reject protected endpoint without token", async () => {
      const response = await request(app.getHttpServer())
        .get("/users/me")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("should reject protected endpoint with invalid token", async () => {
      const response = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Rate limiting", () => {
    it("should enforce rate limits on auth endpoints", async () => {
      const loginDto = {
        username: "nonexistent",
        password: "wrong",
      };

      // Make many requests to trigger rate limit
      const requests = Array(20)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).post("/auth/login").send(loginDto),
        );

      const responses = await Promise.all(requests);

      // Some should be rate limited (429)
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
