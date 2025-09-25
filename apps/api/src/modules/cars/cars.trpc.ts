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

@Injectable()
export class CarsTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly carsService: CarsService,
  ) {}

  router = this.trpc.router({
    // Public route - anyone can list cars (uses default LONG rate limit)
    list: this.trpc.procedure
      .input(
        z
          .object({
            color: carFields.color.optional(),
            skip: z.number().int().min(0).default(0),
            limit: z.number().int().min(0).max(100).optional().default(10),
            sortField: carSortFieldQuerySchema.optional(),
            sortDirection: sortDirectionQuerySchema.optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        return await this.carsService.findAll({ skip: 0, limit: 10, ...input });
      }),

    // Public route - anyone can view car details (uses default LONG rate limit)
    getById: this.trpc.procedure
      .input(z.object({ id: uuidSchema }))
      .query(async ({ input }) => {
        return await this.carsService.findById(input.id);
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

        return await this.carsService.getFavoritesByUser({
          userId,
          skip: 0,
          limit: 10,
          ...input,
        });
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
