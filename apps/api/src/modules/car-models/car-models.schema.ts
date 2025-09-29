import { slugSchema, uuidSchema } from "@api/common/schemas/common.schema";
import { z } from "zod";

export const carModelFields = {
  id: uuidSchema.describe("The unique id of the car model (UUID)"),
  name: z.string().min(1).max(255).describe("The name of the car model"),
  slug: slugSchema.describe("The slug of the car model"),
  manufacturerId: uuidSchema.describe(
    "The manufacturer ID this model belongs to",
  ),
  createdAt: z.iso.datetime().describe("When the car model was created"),
  updatedAt: z.iso.datetime().describe("When the car model was last updated"),
};

export const carModelSortFieldQuerySchema = z
  .enum(["name", "createdAt", "updatedAt"])
  .optional()
  .describe("Field to sort car models by");

export type CarModelSortField = z.infer<typeof carModelSortFieldQuerySchema>;
