import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { sortDirectionQuerySchema } from "../../../common/schemas/common.schema";
import { carManufacturerFields } from "../../car-manufacturers/car-manufacturers.schema";
import {
  carModelFields,
  carModelSortFieldQuerySchema,
} from "../car-models.schema";

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

export const findCarModelsQuerySchema = z
  .object({
    manufacturerSlug: carManufacturerFields.slug.optional(),
    skip: restSkipSchema,
    limit: restLimitSchema,
    sortField: carModelSortFieldQuerySchema,
    sortDirection: sortDirectionQuerySchema,
  })
  .strict();

export const carModelIdParamSchema = z
  .object({
    id: carModelFields.id,
  })
  .strict();

export const carModelSlugParamSchema = z
  .object({
    slug: carModelFields.slug,
  })
  .strict();

export class FindCarModelsQueryDto extends createZodDto(
  findCarModelsQuerySchema,
) {}
export class CarModelIdParamDto extends createZodDto(carModelIdParamSchema) {}
export class CarModelSlugParamDto extends createZodDto(
  carModelSlugParamSchema,
) {}
