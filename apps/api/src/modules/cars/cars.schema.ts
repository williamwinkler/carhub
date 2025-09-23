import { uuidSchema } from "@api/common/schemas/common.schema";
import { z } from "zod";
import type { Car } from "./entities/car.entity";
import { carModelFields } from "../car-models/car-models.schema";

export const carFields = {
  id: uuidSchema.describe("The unique id of the car (UUID)"),
  modelId: carModelFields.id,
  year: z
    .number()
    .int()
    .gte(1886, { message: "Cars were not mass-produced before 1886" })
    .lte(new Date().getFullYear() + 1)
    .describe("The year the car was manufactured"),
  color: z.string().min(1).max(100).describe("The color of the car"),
  kmDriven: z
    .number()
    .int()
    .gte(0)
    .max(10_000_000)
    .describe("The amount of kilometers the car has driven"),
  price: z.number().int().min(0).describe("Price of the car in €"),
  createdBy: z.uuid().describe("The user who created this car"),
  createdAt: z.iso.datetime().describe("When the car record was created"),
  updatedAt: z.iso.datetime().describe("When the car record was last updated"),
  isFavorite: z
    .boolean()
    .describe("Indicates if the user has favorited the car or not"),
} as const;

const carSortFields: (keyof Car)[] = [
  "model",
  "year",
  "color",
  "kmDriven",
  "price",
  "createdAt",
] as const;

export const carSortFieldQuerySchema = z.enum(carSortFields).optional();
