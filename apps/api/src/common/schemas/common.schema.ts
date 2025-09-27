// src/common/schemas/query-params.schema.ts
import type { UUID } from "crypto";
import { z } from "zod";

export const skipSchema = z.coerce
  .number()
  .int()
  .min(0)
  .default(0)
  .describe("The amount of items to skip.");

export const limitSchema = z.coerce
  .number()
  .int()
  .min(0)
  .default(20)
  .describe("The limit of items to be returned.");

export const uuidSchema = z
  .uuid()
  .transform((val) => val as UUID)
  .describe("id (UUID)");

export const sortDirectionQuerySchema = z
  .string()
  .optional()
  .refine((val) => !val || ["asc", "desc"].includes(val), {
    message: "Sort direction must be either 'asc' or 'desc'",
  })
  .transform((val) => val as "asc" | "desc" | undefined)
  .describe("Sort direction (ascending or descending)");

export const slugSchema = z.string().min(1).max(255);

export const skipLimitSchema = z
  .object({
    skip: skipSchema,
    limit: limitSchema,
  })
  .strict();
