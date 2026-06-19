// src/modules/cars/cars.trpc.ts
import { createPaginationSchema } from "@api/common/dto/pagination.dto";
import {
  skipLimitSchema,
  sortDirectionQuerySchema,
  uuidSchema,
} from "@api/common/schemas/common.schema";
import { z } from "zod";
import { AppError } from "@api/common/errors/app-error";
import { Errors } from "@api/common/errors/errors";
import { carManufacturerFields } from "../car-manufacturers/car-manufacturers.schema";
import { carModelFields } from "../car-models/car-models.schema";
import type { TrpcService } from "../trpc/trpc.service";
import type { CarsAdapter } from "./cars.adapter";
import { carFields, carSortByFieldQuerySchema } from "./cars.schema";
import type { CarsService } from "./cars.service";
import { carResponseSchema } from "./dto/car.dto";
import { createCarSchema } from "./dto/create-car.dto";
import { updateCarSchema } from "./dto/update-car.dto";

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
const idInputSchema = z.object({ id: uuidSchema });
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

type CarsRouterDeps = {
  trpc: TrpcService;
  carsService: CarsService;
  carsAdapter: CarsAdapter;
};

export function createCarsRouter({
  trpc,
  carsService,
  carsAdapter,
}: CarsRouterDeps) {
  return trpc.router({
    // Public route - anyone can list cars (uses default LONG rate limit)
    list: trpc.publicProcedure
      .input(listCarsSchema)
      .output(carListResponseSchema)
      .query(async ({ input }) => {
        const cars = await carsService.findAll({
          modelSlug: input.modelSlug,
          manufacturerSlug: input.manufacturerSlug,
          color: input.color,
          sortField: input.sortBy,
          sortDirection: input.sortDirection,
          skip: input.skip || 0,
          limit: input.limit || 10,
        });

        return carsAdapter.getListDto(cars);
      }),

    // Public route - anyone can view car details (uses default LONG rate limit)
    getById: trpc.publicProcedure
      .input(idInputSchema)
      .output(carResponseSchema)
      .query(async ({ input }) => {
        const car = await carsService.findById(input.id);
        if (!car) {
          throw new AppError(Errors.CAR_NOT_FOUND);
        }

        return carsAdapter.getDto(car);
      }),

    // Authenticated route - creating cars with medium rate limiting for protection
    create: trpc.protectedMediumProcedure
      .input(createCarSchema)
      .output(carResponseSchema)
      .mutation(async ({ input }) => {
        const car = await carsService.create(input);

        return carsAdapter.getDto(car);
      }),

    // Authenticated route - updating cars with medium rate limiting for protection
    update: trpc.protectedMediumProcedure
      .input(updateCarInputSchema)
      .output(carResponseSchema)
      .mutation(async ({ input }) => {
        const car = await carsService.update(input.id, input.data);

        return carsAdapter.getDto(car);
      }),

    // Authenticated route - deleting cars with short rate limiting (most restrictive)
    deleteById: trpc.protectedShortProcedure
      .input(idInputSchema)
      .output(successSchema)
      .mutation(async ({ input }) => {
        await carsService.softDelete(input.id);

        return { success: true };
      }),

    // Authenticated route - toggle favorite (uses default rate limiting)
    toggleFavorite: trpc.protectedProcedure
      .input(idInputSchema)
      .output(favoriteResponseSchema)
      .mutation(async ({ input, ctx }) => {
        const favorited = await carsService.toggleFavoriteForUser(
          input.id,
          ctx.principal.id,
        );

        return { favorited };
      }),

    // Authenticated route - get user's favorite cars (uses default rate limiting)
    getFavorites: trpc.protectedProcedure
      .input(optionalSkipLimitSchema)
      .output(carListResponseSchema)
      .query(async ({ input, ctx }) => {
        const cars = await carsService.getFavoritesByUser({
          userId: ctx.principal.id,
          skip: 0,
          limit: 10,
          ...input,
        });

        return carsAdapter.getListDto(cars);
      }),

    // Authenticated route - get current user's own cars
    getMyCars: trpc.protectedProcedure
      .input(skipLimitSchema)
      .output(carListResponseSchema)
      .query(async ({ input, ctx }) => {
        const cars = await carsService.getCarsByUser({
          userId: ctx.principal.id,
          limit: input.limit,
          skip: input.skip,
        });

        return carsAdapter.getListDto(cars);
      }),

    // Public route - get any user's cars by user ID
    getCarsByUserId: trpc.publicProcedure
      .input(getCarsByUserIdSchema)
      .output(carListResponseSchema)
      .query(async ({ input }) => {
        const cars = await carsService.getCarsByUser({
          userId: input.userId,
          limit: input.limit,
          skip: input.skip,
        });

        return carsAdapter.getListDto(cars);
      }),
  });
}

export type CarsRouter = ReturnType<typeof createCarsRouter>;
