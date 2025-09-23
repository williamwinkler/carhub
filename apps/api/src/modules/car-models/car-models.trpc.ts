import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  sortDirectionQuerySchema,
  uuidSchema,
} from "../../common/schemas/common.schema";
import { TrpcService } from "../trpc/trpc.service";
import { CarModelsAdapter } from "./car-models.adapter";
import {
  carModelFields,
  carModelSortFieldQuerySchema,
} from "./car-models.schema";
import { CarModelsService } from "./car-models.service";
import { createCarModelSchema } from "./dto/create-car-model.dto";
import { updateCarModelSchema } from "./dto/update-car-model.dto";

@Injectable()
export class CarModelsTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly carModelsService: CarModelsService,
    private readonly carModelsAdapter: CarModelsAdapter,
  ) {}

  router = this.trpc.router({
    // List car models (public)
    list: this.trpc.procedure
      .input(
        z
          .object({
            manufacturerId: uuidSchema.optional(),
            skip: z.number().int().min(0).default(0),
            limit: z.number().int().min(0).max(100).optional().default(20),
            sortField: carModelSortFieldQuerySchema.optional(),
            sortDirection: sortDirectionQuerySchema.optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const carModels = await this.carModelsService.findAll({
          manufacturerId: input?.manufacturerId,
          skip: input?.skip || 0,
          limit: input?.limit || 20,
          sortField: input?.sortField,
          sortDirection: input?.sortDirection,
        });

        return this.carModelsAdapter.getListDto(carModels);
      }),

    // Get car model by ID (public)
    getById: this.trpc.procedure
      .input(z.object({ id: uuidSchema }))
      .query(async ({ input }) => {
        const carModel = await this.carModelsService.findById(input.id);
        if (!carModel) {
          throw new Error("Car model not found");
        }

        return this.carModelsAdapter.getDto(carModel);
      }),

    // Create car model (admin only)
    create: this.trpc.authenticatedMediumProcedure
      .input(createCarModelSchema)
      .mutation(async ({ input }) => {
        const principal = Ctx.principalRequired();
        if (principal.role !== "admin") {
          throw new Error("Only admins can create car models");
        }

        const carModel = await this.carModelsService.create(input);

        return this.carModelsAdapter.getDto(carModel);
      }),

    // Update car model (admin only)
    update: this.trpc.authenticatedMediumProcedure
      .input(
        z.object({
          id: carModelFields.id,
          data: updateCarModelSchema,
        }),
      )
      .mutation(async ({ input }) => {
        const principal = Ctx.principalRequired();
        if (principal.role !== "admin") {
          throw new Error("Only admins can update car models");
        }

        const carModel = await this.carModelsService.update(
          input.id,
          input.data,
        );

        return this.carModelsAdapter.getDto(carModel);
      }),

    // Delete car model (admin only)
    delete: this.trpc.authenticatedMediumProcedure
      .input(z.object({ id: carModelFields.id }))
      .mutation(async ({ input }) => {
        const principal = Ctx.principalRequired();
        if (principal.role !== "admin") {
          throw new Error("Only admins can delete car models");
        }

        await this.carModelsService.delete(input.id);

        return { success: true };
      }),
  });
}
