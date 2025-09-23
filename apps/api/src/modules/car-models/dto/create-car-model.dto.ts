import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { carModelFields } from "../car-models.schema";

export const createCarModelSchema = z
  .object({
    name: carModelFields.name,
    manufacturerId: carModelFields.manufacturerId,
  })
  .strict();

export class CreateCarModelDto extends createZodDto(createCarModelSchema) {}
