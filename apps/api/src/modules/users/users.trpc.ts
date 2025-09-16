// src/modules/users/users.trpc.ts
import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { TrpcService } from "../trpc/trpc.service";
import { CarsService } from "../cars/cars.service";

@Injectable()
export class UsersTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly carsService: CarsService,
  ) {}

  router = this.trpc.router({
    // Authenticated route - get current user's favorite cars
    getFavoriteCars: this.trpc.authenticatedProcedure
      .input(
        z.object({
          skip: z.number().int().min(0).default(0),
          limit: z.number().int().min(0).max(100).default(20),
        }),
      )
      .query(async ({ input }) => {
        const userId = Ctx.userIdRequired();

        return await this.carsService.getFavoritesByUser({ userId, ...input });
      }),

    // Authenticated route - get current user's own cars
    getMyCars: this.trpc.authenticatedProcedure.query(async () => {
      const userId = Ctx.userIdRequired();
      const allCars = await this.carsService.findAll({ skip: 0, limit: 1000 });

      return allCars.items.filter((car) => car.createdBy === userId);
    }),
  });
}
