import { createPaginationSchema } from "@api/common/dto/pagination.dto";
import { z } from "zod";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
} from "../../common/schemas/common.schema";
import { carManufacturerFields } from "../car-manufacturers/car-manufacturers.schema";
import type { TrpcService } from "../trpc/trpc.service";
import type { CarModelsAdapter } from "./car-models.adapter";
import { carModelSortFieldQuerySchema } from "./car-models.schema";
import type { CarModelsService } from "./car-models.service";
import { carModelSchema } from "./dto/car-model.dto";

const listCarModelsSchema = z
  .object({
    manufacturerSlug: carManufacturerFields.slug.optional(),
    skip: skipSchema.optional(),
    limit: limitSchema.optional(),
    sortField: carModelSortFieldQuerySchema.optional(),
    sortDirection: sortDirectionQuerySchema.optional(),
  })
  .strict()
  .optional();

const carModelListResponseSchema = createPaginationSchema(carModelSchema);

type CarModelsRouterDeps = {
  trpc: TrpcService;
  carModelsService: CarModelsService;
  carModelsAdapter: CarModelsAdapter;
};

export function createCarModelsRouter({
  trpc,
  carModelsService,
  carModelsAdapter,
}: CarModelsRouterDeps) {
  return trpc.router({
    // List car models (public)
    list: trpc.publicProcedure
      .input(listCarModelsSchema)
      .output(carModelListResponseSchema)
      .query(async ({ input }) => {
        const carModels = await carModelsService.findAll({
          manufacturerSlug: input?.manufacturerSlug,
          skip: input?.skip ?? 0,
          limit: input?.limit ?? 100,
          sortField: input?.sortField,
          sortDirection: input?.sortDirection,
        });

        return carModelsAdapter.getListDto(carModels);
      }),
  });
}

export type CarModelsRouter = ReturnType<typeof createCarModelsRouter>;
