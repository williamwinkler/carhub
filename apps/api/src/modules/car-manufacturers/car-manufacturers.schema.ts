import { slugSchema, uuidSchema } from "@api/common/schemas/common.schema";
import { z } from "zod";

export const carManufacturerFields = {
  id: uuidSchema.describe("The unique id of the car manufacturer (UUID)"),
  name: z.string().min(1).max(255).describe("The name of the car manufacturer"),
  slug: slugSchema.describe("The slug of the car manufacturer"),
  createdAt: z.iso.datetime().describe("When the car manufacturer was created"),
  updatedAt: z.iso
    .datetime()
    .describe("When the car manufacturer was last updated"),
};

export const carManufacturerSortFieldQuerySchema = z
  .enum(["name", "createdAt", "updatedAt"])
  .optional()
  .describe("Field to sort car manufacturers by");

export type CarManufacturerSortField = z.infer<
  typeof carManufacturerSortFieldQuerySchema
>;

export type CarManufacturerId = z.infer<typeof carManufacturerFields.id>;
