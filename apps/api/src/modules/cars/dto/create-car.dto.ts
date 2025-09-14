import { uuidSchema } from "@api/common/schemas/common.schema";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const carYearSchema = z
  .number()
  .int()
  .gte(1886, { message: "Cars were not mass-produced before 1886" })
  .lte(new Date().getFullYear() + 1)
  .describe("The year the it was manufactored.");

export const carColorSchema = z
  .string()
  .min(0)
  .max(100)
  .describe("The color of the car.");

export const createCarSchema = z
  .object({
    modelId: uuidSchema.describe("The ID of the model"),
    year: carYearSchema,
    color: carColorSchema,
    kmDriven: z
      .number()
      .int()
      .gte(0)
      .max(10_000_000)
      .describe("The amount of kilometers the car has driven"),
    price: z.number().int().min(0).describe("Price of the car in €"),
  })
  .strict();

export class CreateCarDto extends createZodDto(createCarSchema) {}
