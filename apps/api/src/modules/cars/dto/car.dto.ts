import { carModelSchema } from "@api/modules/car-models/dto/car-model.dto";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { carFields } from "../cars.schema";

export const carResponseSchema = z
  .object({
    id: carFields.id,
    year: carFields.year,
    color: carFields.color,
    kmDriven: carFields.kmDriven,
    price: carFields.price,
    createdBy: carFields.createdBy,
    createdAt: carFields.createdAt,
    updatedAt: carFields.updatedAt,
    isFavorite: carFields.isFavorite,
    model: carModelSchema,
  })
  .strict();

export class CarDto extends createZodDto(carResponseSchema) {}
