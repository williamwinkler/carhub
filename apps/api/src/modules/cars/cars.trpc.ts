// src/modules/cars/cars.trpc.ts
import { uuidSchema } from "@api/common/schemas/common.schema";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { TrpcService } from "../trpc/trpc.service";
import { CarsService } from "./cars.service";
import {
  carBrandSchema,
  carColorSchema,
  carModelSchema,
  createCarSchema,
} from "./dto/create-car.dto";
import { updateCarSchema } from "./dto/update-car.dto";

@Injectable()
export class CarsTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly carsService: CarsService,
  ) {}

  router = this.trpc.router({
    list: this.trpc.procedure
      .input(
        z
          .object({
            brand: carBrandSchema.optional(),
            model: carModelSchema.optional(),
            color: carColorSchema.optional(),
            skip: z.number().int().min(0).default(0),
            limit: z.number().int().min(100).optional().default(10),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        return await this.carsService.findAll({ skip: 0, limit: 10, ...input });
      }),

    getById: this.trpc.procedure
      .input(z.object({ id: uuidSchema }))
      .query(async ({ input }) => {
        return await this.carsService.findById(input.id);
      }),

    create: this.trpc.procedure
      .input(createCarSchema)
      .mutation(async ({ input }) => {
        return await this.carsService.create(input);
      }),

    update: this.trpc.procedure
      .input(
        z.object({
          id: uuidSchema,
          data: updateCarSchema,
        }),
      )
      .mutation(async ({ input }) => {
        return await this.carsService.update(input.id, input.data);
      }),

    deleteById: this.trpc.procedure
      .input(z.object({ id: uuidSchema }))
      .mutation(async ({ input }) => {
        return await this.carsService.remove(input.id);
      }),
  });
}
