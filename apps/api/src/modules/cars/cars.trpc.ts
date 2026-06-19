// src/modules/cars/cars.trpc.ts
import { Ctx } from "@api/common/ctx";
import {
  createPaginationSchema,
  type PaginationDto,
} from "@api/common/dto/pagination.dto";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import {
  skipLimitSchema,
  sortDirectionQuerySchema,
  uuidSchema,
} from "@api/common/schemas/common.schema";
import { Inject, Injectable } from "@nestjs/common";
import type { UUID } from "crypto";
import { Input, Mutation, Query, Router, UseMiddlewares } from "nestjs-trpc";
import { z } from "zod";
import { carManufacturerFields } from "../car-manufacturers/car-manufacturers.schema";
import { carModelFields } from "../car-models/car-models.schema";
import {
  TrpcAuthMiddleware,
  TrpcMediumRateLimitMiddleware,
  TrpcShortRateLimitMiddleware,
} from "../trpc/trpc.middlewares";
import { CarsAdapter } from "./cars.adapter";
import { carFields, carSortByFieldQuerySchema } from "./cars.schema";
import { CarsService } from "./cars.service";
import { carResponseSchema, type CarDto } from "./dto/car.dto";
import { createCarSchema, type CreateCarDto } from "./dto/create-car.dto";
import { updateCarSchema, type UpdateCarDto } from "./dto/update-car.dto";

const listCarsSchema = z.object({
  modelSlug: carModelFields.slug.optional(),
  manufacturerSlug: carManufacturerFields.slug.optional(),
  color: carFields.color.optional().transform((v) => v?.toLowerCase()),
  skip: z.number().int().min(0).default(0),
  limit: z.number().int().min(0).max(100).optional().default(10),
  sortBy: carSortByFieldQuerySchema.optional(),
  sortDirection: sortDirectionQuerySchema.optional(),
});
const updateCarInputSchema = z.object({
  id: uuidSchema,
  data: updateCarSchema,
});
const optionalSkipLimitSchema = z
  .object({
    skip: z.number().int().min(0).default(0),
    limit: z.number().int().min(0).max(100).optional().default(10),
  })
  .optional();
const getCarsByUserIdSchema = z.object({
  userId: uuidSchema,
  skip: z.number().int().min(0).default(0),
  limit: z.number().int().min(0).max(100).optional().default(10),
});
const carListResponseSchema = createPaginationSchema(carResponseSchema);
const successSchema = z.object({ success: z.boolean() }).strict();
const favoriteResponseSchema = z.object({ favorited: z.boolean() }).strict();

type ListCarsInput = z.infer<typeof listCarsSchema>;
type IdInput = { id: UUID };
type UpdateCarInput = { id: UUID; data: UpdateCarDto };
type OptionalSkipLimitInput = z.infer<typeof optionalSkipLimitSchema>;
type GetCarsByUserIdInput = z.infer<typeof getCarsByUserIdSchema>;

@Router({ alias: "cars" })
@Injectable()
export class CarsTrpc {
  constructor(
    @Inject(CarsService) private readonly carsService: CarsService,
    @Inject(CarsAdapter) private readonly carsAdapter: CarsAdapter,
  ) {}

  // Public route - anyone can list cars (uses default LONG rate limit)
  @Query({ input: listCarsSchema, output: carListResponseSchema })
  async list(@Input() input: ListCarsInput): Promise<PaginationDto<CarDto>> {
    const cars = await this.carsService.findAll({
      modelSlug: input.modelSlug,
      manufacturerSlug: input.manufacturerSlug,
      color: input.color,
      sortField: input.sortBy,
      sortDirection: input.sortDirection,
      skip: input.skip || 0,
      limit: input.limit || 10,
    });

    return this.carsAdapter.getListDto(cars);
  }

  // Public route - anyone can view car details (uses default LONG rate limit)
  @Query({ input: z.object({ id: uuidSchema }), output: carResponseSchema })
  async getById(@Input() input: IdInput): Promise<CarDto> {
    const car = await this.carsService.findById(input.id);
    if (!car) {
      throw new AppError(Errors.CAR_NOT_FOUND);
    }

    return this.carsAdapter.getDto(car);
  }

  // Authenticated route - creating cars with medium rate limiting for protection
  @UseMiddlewares(TrpcAuthMiddleware, TrpcMediumRateLimitMiddleware)
  @Mutation({ input: createCarSchema, output: carResponseSchema })
  async create(@Input() input: CreateCarDto) {
    const car = await this.carsService.create(input);

    return "test";
  }

  // Authenticated route - updating cars with medium rate limiting for protection
  @UseMiddlewares(TrpcAuthMiddleware, TrpcMediumRateLimitMiddleware)
  @Mutation({ input: updateCarInputSchema, output: carResponseSchema })
  async update(@Input() input: UpdateCarInput): Promise<CarDto> {
    const car = await this.carsService.update(input.id, input.data);

    return this.carsAdapter.getDto(car);
  }

  // Authenticated route - deleting cars with short rate limiting (most restrictive)
  @UseMiddlewares(TrpcAuthMiddleware, TrpcShortRateLimitMiddleware)
  @Mutation({ input: z.object({ id: uuidSchema }), output: successSchema })
  async deleteById(@Input() input: IdInput): Promise<{ success: boolean }> {
    await this.carsService.softDelete(input.id);

    return { success: true };
  }

  // Authenticated route - toggle favorite (uses default rate limiting)
  @UseMiddlewares(TrpcAuthMiddleware)
  @Mutation({
    input: z.object({ id: uuidSchema }),
    output: favoriteResponseSchema,
  })
  async toggleFavorite(
    @Input() input: IdInput,
  ): Promise<{ favorited: boolean }> {
    const userId = Ctx.userIdRequired();

    const favorited = await this.carsService.toggleFavoriteForUser(
      input.id,
      userId,
    );

    return { favorited };
  }

  // Authenticated route - get user's favorite cars (uses default rate limiting)
  @UseMiddlewares(TrpcAuthMiddleware)
  @Query({ input: optionalSkipLimitSchema, output: carListResponseSchema })
  async getFavorites(
    @Input() input: OptionalSkipLimitInput,
  ): Promise<PaginationDto<CarDto>> {
    const userId = Ctx.userIdRequired();

    const cars = await this.carsService.getFavoritesByUser({
      userId,
      skip: 0,
      limit: 10,
      ...input,
    });

    return this.carsAdapter.getListDto(cars);
  }

  // Authenticated route - get current user's own cars
  @UseMiddlewares(TrpcAuthMiddleware)
  @Query({ input: skipLimitSchema, output: carListResponseSchema })
  async getMyCars(
    @Input() input: { limit: number; skip: number },
  ): Promise<PaginationDto<CarDto>> {
    const userId = Ctx.userIdRequired();

    const cars = await this.carsService.getCarsByUser({
      userId,
      limit: input.limit,
      skip: input.skip,
    });

    return this.carsAdapter.getListDto(cars);
  }

  // Public route - get any user's cars by user ID
  @Query({ input: getCarsByUserIdSchema, output: carListResponseSchema })
  async getCarsByUserId(
    @Input() input: GetCarsByUserIdInput,
  ): Promise<PaginationDto<CarDto>> {
    const cars = await this.carsService.getCarsByUser({
      userId: input.userId,
      limit: input.limit,
      skip: input.skip,
    });

    return this.carsAdapter.getListDto(cars);
  }
}
