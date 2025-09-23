import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { carManufacturerFields } from "../car-manufacturers.schema";

export const createCarManufacturerSchema = z
  .object({
    name: carManufacturerFields.name,
  })
  .strict();

export class CreateCarManufacturerDto extends createZodDto(
  createCarManufacturerSchema,
) {}
