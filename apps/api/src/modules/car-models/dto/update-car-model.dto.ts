import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { carModelFields } from "../car-models.schema";

export const updateCarModelSchema = z
  .object({
    name: carModelFields.name.optional(),
    manufacturerId: carModelFields.manufacturerId.optional(),
  })
  .strict();

export class UpdateCarModelDto extends createZodDto(updateCarModelSchema) {}
