import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { sortDirectionQuerySchema } from "../../../common/schemas/common.schema";
import {
  carManufacturerFields,
  carManufacturerSortFieldQuerySchema,
} from "../car-manufacturers.schema";

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

export const findCarManufacturersQuerySchema = z
  .object({
    skip: restSkipSchema,
    limit: restLimitSchema,
    sortField: carManufacturerSortFieldQuerySchema,
    sortDirection: sortDirectionQuerySchema,
  })
  .strict();

export const carManufacturerIdParamSchema = z
  .object({
    id: carManufacturerFields.id,
  })
  .strict();

export class FindCarManufacturersQueryDto extends createZodDto(
  findCarManufacturersQuerySchema,
) {}
export class CarManufacturerIdParamDto extends createZodDto(
  carManufacturerIdParamSchema,
) {}
