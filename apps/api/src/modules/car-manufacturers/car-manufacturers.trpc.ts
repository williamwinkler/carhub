import { Ctx } from "@api/common/ctx";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  sortDirectionQuerySchema,
  uuidSchema,
} from "../../common/schemas/common.schema";
import { TrpcService } from "../trpc/trpc.service";
import { CarManufacturersAdapter } from "./car-manufacturers.adapter";
import {
  carManufacturerFields,
  carManufacturerSortFieldQuerySchema,
} from "./car-manufacturers.schema";
import { ManufacturersService } from "./car-manufacturers.service";
import { createCarManufacturerSchema } from "./dto/create-car-manufacturer.dto";
import { updateCarManufacturerSchema } from "./dto/update-car-manufacturer.dto";

@Injectable()
export class CarManufacturersTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly manufacturersService: ManufacturersService,
    private readonly manufacturersAdapter: CarManufacturersAdapter,
  ) {}

  router = this.trpc.router({
    // List car manufacturers (public)
    list: this.trpc.procedure
      .input(
        z
          .object({
            skip: z.number().int().min(0).default(0),
            limit: z.number().int().min(0).max(100).optional().default(20),
            sortField: carManufacturerSortFieldQuerySchema.optional(),
            sortDirection: sortDirectionQuerySchema.optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const carManufacturers = await this.manufacturersService.findAll({
          skip: input?.skip || 0,
          limit: input?.limit || 20,
          sortField: input?.sortField,
          sortDirection: input?.sortDirection,
        });

        return this.manufacturersAdapter.getListDto(carManufacturers);
      }),

    // Get car manufacturer by ID (public)
    getById: this.trpc.procedure
      .input(z.object({ id: uuidSchema }))
      .query(async ({ input }) => {
        const carManufacturer = await this.manufacturersService.findById(
          input.id,
        );
        if (!carManufacturer) {
          throw new Error("Car manufacturer not found");
        }

        return this.manufacturersAdapter.getDto(carManufacturer);
      }),

    // Create car manufacturer (admin only)
    create: this.trpc.authenticatedMediumProcedure
      .input(createCarManufacturerSchema)
      .mutation(async ({ input }) => {
        const principal = Ctx.principalRequired();
        if (principal.role !== "admin") {
          throw new Error("Only admins can create car manufacturers");
        }

        const carManufacturer = await this.manufacturersService.create(input);

        return this.manufacturersAdapter.getDto(carManufacturer);
      }),

    // Update car manufacturer (admin only)
    update: this.trpc.authenticatedMediumProcedure
      .input(
        z.object({
          id: carManufacturerFields.id,
          data: updateCarManufacturerSchema,
        }),
      )
      .mutation(async ({ input }) => {
        const principal = Ctx.principalRequired();
        if (principal.role !== "admin") {
          throw new Error("Only admins can update car manufacturers");
        }

        const carManufacturer = await this.manufacturersService.update(
          input.id,
          input.data,
        );

        return this.manufacturersAdapter.getDto(carManufacturer);
      }),

    // Delete car manufacturer (admin only)
    delete: this.trpc.authenticatedMediumProcedure
      .input(z.object({ id: carManufacturerFields.id }))
      .mutation(async ({ input }) => {
        const principal = Ctx.principalRequired();
        if (principal.role !== "admin") {
          throw new Error("Only admins can delete car manufacturers");
        }

        await this.manufacturersService.delete(input.id);

        return { success: true };
      }),
  });
}
