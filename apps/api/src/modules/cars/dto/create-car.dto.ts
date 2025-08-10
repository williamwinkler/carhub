import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { CarBrand } from "../entities/car.entity";

export const carBrandSchema = z
  .nativeEnum(CarBrand)
  .describe("The brand of the car.");

export const carModelSchema = z
  .string()
  .min(1, "Model name is required")
  .max(100, "Model name must be at most 255 characters long")
  .describe("The model of the car.");

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
    brand: carBrandSchema,
    model: carModelSchema,
    year: carYearSchema,
    color: carColorSchema,
    kmDriven: z.number().int().gte(0),
    price: z.number().min(0),
  })
  .strict();

export class CreateCarDto extends createZodDto(createCarSchema) {}
