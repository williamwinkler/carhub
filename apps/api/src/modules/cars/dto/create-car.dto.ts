import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { carFields } from "../cars.schema";

export const createCarSchema = z
  .object({
    modelId: carFields.modelId,
    year: carFields.year,
    color: carFields.color,
    kmDriven: carFields.kmDriven,
    price: carFields.price,
  })
  .strict();

export class CreateCarDto extends createZodDto(createCarSchema) {}
