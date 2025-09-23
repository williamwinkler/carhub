import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { carManufacturerFields } from "../car-manufacturers.schema";

export const carManufacturerResponseSchema = z
  .object({
    id: carManufacturerFields.id,
    name: carManufacturerFields.name,
    slug: carManufacturerFields.slug,
  })
  .strict();

export class CarManufacturerDto extends createZodDto(
  carManufacturerResponseSchema,
) {}
