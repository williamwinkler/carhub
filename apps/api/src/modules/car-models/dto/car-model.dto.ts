import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { carModelFields } from "../car-models.schema";

// Full schema with manufacturerId for creation/updates
export const carModelSchema = z
  .object({
    id: carModelFields.id,
    name: carModelFields.name,
    slug: carModelFields.slug,
    manufacturerId: carModelFields.manufacturerId,
  })
  .strict();

export class CarModelDto extends createZodDto(carModelSchema) {}
