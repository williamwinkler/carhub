import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { sortDirectionQuerySchema } from "../../../common/schemas/common.schema";
import { carManufacturerFields } from "../../car-manufacturers/car-manufacturers.schema";
import { carModelFields } from "../../car-models/car-models.schema";
import { carFields, carSortByFieldQuerySchema } from "../cars.schema";

const restLimitSchema = z.coerce
  .number()
  .int()
  .min(0)
  .default(20)
  .describe("The limit of items to be returned.");

const restSkipSchema = z.coerce
  .number()
  .int()
  .min(0)
  .default(0)
  .describe("The amount of items to skip.");

export const findCarsQuerySchema = z
  .object({
    modelSlug: carModelFields.slug.optional(),
    manufacturerSlug: carManufacturerFields.slug.optional(),
    color: carFields.color.optional(),
    skip: restSkipSchema,
    limit: restLimitSchema,
    sortField: carSortByFieldQuerySchema,
    sortDirection: sortDirectionQuerySchema,
  })
  .strict();

export const carIdParamSchema = z
  .object({
    id: carFields.id,
  })
  .strict();

export const favoriteCarsQuerySchema = z
  .object({
    skip: restSkipSchema,
    limit: restLimitSchema,
  })
  .strict();

export class FindCarsQueryDto extends createZodDto(findCarsQuerySchema) {}
export class CarIdParamDto extends createZodDto(carIdParamSchema) {}
export class FavoriteCarsQueryDto extends createZodDto(
  favoriteCarsQuerySchema,
) {}
