import { createPaginationSchema } from "@api/common/dto/pagination.dto";
import { Inject, Injectable } from "@nestjs/common";
import { Input, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
} from "../../common/schemas/common.schema";
import { CarManufacturersAdapter } from "./car-manufacturers.adapter";
import { carManufacturerSortFieldQuerySchema } from "./car-manufacturers.schema";
import { carManufacturerSchema } from "./dto/car-manufacturer.dto";
import { CarManufacturersService } from "./car-manufacturers.service";

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

type ListCarManufacturersInput = z.infer<typeof listCarManufacturersSchema>;

@Router({ alias: "carManufacturers" })
@Injectable()
export class CarManufacturersTrpc {
  constructor(
    @Inject(CarManufacturersService)
    private readonly manufacturersService: CarManufacturersService,
    @Inject(CarManufacturersAdapter)
    private readonly manufacturersAdapter: CarManufacturersAdapter,
  ) {}

  // List car manufacturers (public)
  @Query({
    input: listCarManufacturersSchema,
    output: carManufacturerListResponseSchema,
  })
  async list(@Input() input: ListCarManufacturersInput) {
    const carManufacturers = await this.manufacturersService.findAll({
      skip: input?.skip ?? 0,
      limit: input?.limit ?? 100,
      sortField: input?.sortField,
      sortDirection: input?.sortDirection,
    });

    return this.manufacturersAdapter.getListDto(carManufacturers);
  }
}
