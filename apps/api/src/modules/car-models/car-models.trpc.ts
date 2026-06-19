import { createPaginationSchema } from "@api/common/dto/pagination.dto";
import { Inject, Injectable } from "@nestjs/common";
import { Input, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import {
  limitSchema,
  skipSchema,
  sortDirectionQuerySchema,
} from "../../common/schemas/common.schema";
import { carManufacturerFields } from "../car-manufacturers/car-manufacturers.schema";
import { CarModelsAdapter } from "./car-models.adapter";
import { carModelSchema } from "./dto/car-model.dto";
import { carModelSortFieldQuerySchema } from "./car-models.schema";
import { CarModelsService } from "./car-models.service";

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

type ListCarModelsInput = z.infer<typeof listCarModelsSchema>;

@Router({ alias: "carModels" })
@Injectable()
export class CarModelsTrpc {
  constructor(
    @Inject(CarModelsService)
    private readonly carModelsService: CarModelsService,
    @Inject(CarModelsAdapter)
    private readonly carModelsAdapter: CarModelsAdapter,
  ) {}

  // List car models (public)
  @Query({ input: listCarModelsSchema, output: carModelListResponseSchema })
  async list(@Input() input: ListCarModelsInput) {
    const carModels = await this.carModelsService.findAll({
      manufacturerSlug: input?.manufacturerSlug,
      skip: input?.skip ?? 0,
      limit: input?.limit ?? 100,
      sortField: input?.sortField,
      sortDirection: input?.sortDirection,
    });

    return this.carModelsAdapter.getListDto(carModels);
  }
}
