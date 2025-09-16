// src/common/schemas/query-params.schema.ts
import { Role } from "@api/modules/users/entities/user.entity";
import type { UUID } from "crypto";
import { z } from "zod";

// All queries should start with z.string() since they are strings

export const skipSchema = z
  .string()
  .default("0")
  .refine((val) => !isNaN(Number(val)), {
    message: "Skip must be a valid number",
  })
  .transform((val) => Number(val))
  .pipe(z.number().int().min(0))
  .describe("The amount of items to skip.");

export const limitSchema = z
  .string()
  .default("20")
  .refine((val) => !isNaN(Number(val)), {
    message: "Limit must be a valid number",
  })
  .transform((val) => Number(val))
  .pipe(z.number().int().min(1).max(100))
  .describe("The limit of items to be returned.");

export const uuidSchema = z
  .uuid()
  .transform((val) => val as UUID)
  .describe("id (UUID)");

// Sorting schemas
export const sortFieldSchema = z
  .enum(["brand", "model", "year", "color", "kmDriven", "price"])
  .describe("Field to sort by");

export const sortDirectionSchema = z
  .enum(["ASC", "DESC"])
  .describe("Sort direction (ascending or descending)");

// Query param versions (for REST API)
export const sortFieldQuerySchema = z
  .string()
  .optional()
  .refine(
    (val) =>
      !val ||
      ["brand", "model", "year", "color", "kmDriven", "price"].includes(val),
    {
      message:
        "Sort field must be one of: brand, model, year, color, kmDriven, price",
    },
  )
  .transform(
    (val) =>
      val as
        | "brand"
        | "model"
        | "year"
        | "color"
        | "kmDriven"
        | "price"
        | undefined,
  )
  .describe("Field to sort by");

export const sortDirectionQuerySchema = z
  .string()
  .optional()
  .refine((val) => !val || ["asc", "desc"].includes(val), {
    message: "Sort direction must be either 'asc' or 'desc'",
  })
  .transform((val) => val as "asc" | "desc" | undefined)
  .describe("Sort direction (ascending or descending)");

export const roleSchema = z.enum(Role).describe("The role of the user");
