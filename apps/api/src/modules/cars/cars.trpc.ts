// src/modules/cars/cars.trpc.ts
import { Ctx } from "@api/common/ctx";
import {
  skipLimitSchema,
  sortDirectionQuerySchema,
  uuidSchema,
} from "@api/common/schemas/common.schema";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { TrpcService } from "../trpc/trpc.service";
import { carFields, carSortFieldQuerySchema } from "./cars.schema";
import { CarsService } from "./cars.service";
import { createCarSchema } from "./dto/create-car.dto";
import { updateCarSchema } from "./dto/update-car.dto";
import { carModelFields } from "../car-models/car-models.schema";
import { carManufacturerFields } from "../car-manufacturers/car-manufacturers.schema";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { CarsAdapter } from "./cars.adapter";

@Injectable()
export class CarsTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly carsService: CarsService,
    private readonly carsAdapter: CarsAdapter,
  ) {}

  router = this.trpc.router({
    // Public route - anyone can list cars (uses default LONG rate limit)
    list: this.trpc.procedure
      .input(
        z.object({
          modelSlug: carModelFields.slug.optional(),
          manufacturerSlug: carManufacturerFields.slug.optional(),
          color: carFields.color.optional(),
          skip: z.number().int().min(0).default(0),
          limit: z.number().int().min(0).max(100).optional().default(10),
          sortField: carSortFieldQuerySchema.optional(),
          sortDirection: sortDirectionQuerySchema.optional(),
        }),
      )
      .query(async ({ input }) => {
        const cars = await this.carsService.findAll({
          modelSlug: input.modelSlug,
          manufacturerSlug: input.manufacturerSlug,
          color: input.color,
          sortField: input.sortField,
          sortDirection: input.sortDirection,
          skip: input.skip || 0,
          limit: input.limit || 10,
        });

        return this.carsAdapter.getListDto(cars);
      }),

    // Public route - anyone can view car details (uses default LONG rate limit)
    getById: this.trpc.procedure
      .input(z.object({ id: uuidSchema }))
      .query(async ({ input }) => {
        const car = await this.carsService.findById(input.id);
        if (!car) {
          throw new AppError(Errors.CAR_NOT_FOUND);
        }

        return this.carsAdapter.getDto(car);
      }),

    // Authenticated route - creating cars with medium rate limiting for protection
    create: this.trpc.authenticatedMediumProcedure
      .input(createCarSchema)
      .mutation(async ({ input }) => {
        return await this.carsService.create(input);
      }),

    // Authenticated route - updating cars with medium rate limiting for protection
    update: this.trpc.authenticatedMediumProcedure
      .input(
        z.object({
          id: uuidSchema,
          data: updateCarSchema,
        }),
      )
      .mutation(async ({ input }) => {
        return await this.carsService.update(input.id, input.data);
      }),

    // Authenticated route - deleting cars with short rate limiting (most restrictive)
    deleteById: this.trpc.authenticatedShortProcedure
      .input(z.object({ id: uuidSchema }))
      .mutation(async ({ input }) => {
        return await this.carsService.softDelete(input.id);
      }),

    // Authenticated route - toggle favorite (uses default rate limiting)
    toggleFavorite: this.trpc.authenticatedProcedure
      .input(z.object({ id: uuidSchema }))
      .mutation(async ({ input }) => {
        const userId = Ctx.userIdRequired();

        return await this.carsService.toggleFavoriteForUser(input.id, userId);
      }),

    // Authenticated route - get user's favorite cars (uses default rate limiting)
    getFavorites: this.trpc.authenticatedProcedure
      .input(
        z
          .object({
            skip: z.number().int().min(0).default(0),
            limit: z.number().int().min(0).max(100).optional().default(10),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const userId = Ctx.userIdRequired();

        const favoritedCars = await this.carsService.getFavoritesByUser({
          userId,
          skip: 0,
          limit: 10,
          ...input,
        });

        const favoritedCarsDto = this.carsAdapter.getListDto(favoritedCars);
      }),

    // Authenticated route - get current user's own cars
    getMyCars: this.trpc.authenticatedProcedure
      .input(skipLimitSchema)
      .query(async ({ input: { limit, skip } }) => {
        const userId = Ctx.userIdRequired();

        return await this.carsService.getCarsByUser({ userId, limit, skip });
      }),
  });
}
