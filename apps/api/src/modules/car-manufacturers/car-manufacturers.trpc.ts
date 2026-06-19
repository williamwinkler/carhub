import { createPaginationSchema } from "@api/common/dto/pagination.dto";
import { z } from "zod";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
} from "../../common/schemas/common.schema";
import type { TrpcService } from "../trpc/trpc.service";
import type { CarManufacturersAdapter } from "./car-manufacturers.adapter";
import { carManufacturerSortFieldQuerySchema } from "./car-manufacturers.schema";
import type { CarManufacturersService } from "./car-manufacturers.service";
import { carManufacturerSchema } from "./dto/car-manufacturer.dto";

const listCarManufacturersSchema = z
  .object({
    skip: skipSchema.optional(),
    limit: limitSchema.optional(),
    sortField: carManufacturerSortFieldQuerySchema.optional(),
    sortDirection: sortDirectionQuerySchema.optional(),
  })
  .strict()
  .optional();

const carManufacturerListResponseSchema = createPaginationSchema(
  carManufacturerSchema,
);

type CarManufacturersRouterDeps = {
  trpc: TrpcService;
  manufacturersService: CarManufacturersService;
  manufacturersAdapter: CarManufacturersAdapter;
};

export function createCarManufacturersRouter({
  trpc,
  manufacturersService,
  manufacturersAdapter,
}: CarManufacturersRouterDeps) {
  return trpc.router({
    // List car manufacturers (public)
    list: trpc.publicProcedure
      .input(listCarManufacturersSchema)
      .output(carManufacturerListResponseSchema)
      .query(async ({ input }) => {
        const carManufacturers = await manufacturersService.findAll({
          skip: input?.skip ?? 0,
          limit: input?.limit ?? 100,
          sortField: input?.sortField,
          sortDirection: input?.sortDirection,
        });

        return manufacturersAdapter.getListDto(carManufacturers);
      }),
  });
}

export type CarManufacturersRouter = ReturnType<
  typeof createCarManufacturersRouter
>;
