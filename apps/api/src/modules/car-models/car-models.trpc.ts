import { Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
} from "../../common/schemas/common.schema";
import { carManufacturerFields } from "../car-manufacturers/car-manufacturers.schema";
import { TrpcService } from "../trpc/trpc.service";
import { CarModelsAdapter } from "./car-models.adapter";
import { carModelSortFieldQuerySchema } from "./car-models.schema";
import { CarModelsService } from "./car-models.service";

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
            manufacturerSlug: carManufacturerFields.slug.optional(),
            skip: skipSchema.optional(),
            limit: limitSchema.optional(),
            sortField: carModelSortFieldQuerySchema.optional(),
            sortDirection: sortDirectionQuerySchema.optional(),
          })
          .strict()
          .optional(),
      )
      .query(async ({ input }) => {
        const carModels = await this.carModelsService.findAll({
          manufacturerSlug: input?.manufacturerSlug,
          skip: input?.skip ?? 0,
          limit: input?.limit ?? 100,
          sortField: input?.sortField,
          sortDirection: input?.sortDirection,
        });

        return this.carModelsAdapter.getListDto(carModels);
      }),
  });
}
