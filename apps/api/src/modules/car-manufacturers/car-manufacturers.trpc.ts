import { Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
} from "../../common/schemas/common.schema";
import { TrpcService } from "../trpc/trpc.service";
import { CarManufacturersAdapter } from "./car-manufacturers.adapter";
import { carManufacturerSortFieldQuerySchema } from "./car-manufacturers.schema";
import { CarManufacturersService } from "./car-manufacturers.service";

@Injectable()
export class CarManufacturersTrpc {
  constructor(
    private readonly trpc: TrpcService,
    private readonly manufacturersService: CarManufacturersService,
    private readonly manufacturersAdapter: CarManufacturersAdapter,
  ) {}

  router = this.trpc.router({
    // List car manufacturers (public)
    list: this.trpc.procedure
      .input(
        z
          .object({
            skip: skipSchema.optional(),
            limit: limitSchema.optional(),
            sortField: carManufacturerSortFieldQuerySchema.optional(),
            sortDirection: sortDirectionQuerySchema.optional(),
          })
          .strict()
          .optional(),
      )
      .query(async ({ input }) => {
        const carManufacturers = await this.manufacturersService.findAll({
          skip: input?.skip ?? 0,
          limit: input?.limit ?? 100,
          sortField: input?.sortField,
          sortDirection: input?.sortDirection,
        });

        return this.manufacturersAdapter.getListDto(carManufacturers);
      }),
  });
}
