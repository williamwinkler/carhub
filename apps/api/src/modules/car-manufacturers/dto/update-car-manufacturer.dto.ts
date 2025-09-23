import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { carManufacturerFields } from "../car-manufacturers.schema";

export const updateCarManufacturerSchema = z
  .object({
    name: carManufacturerFields.name.optional(),
  })
  .strict();

export class UpdateCarManufacturerDto extends createZodDto(
  updateCarManufacturerSchema,
) {}
