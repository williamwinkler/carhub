// src/common/schemas/query-params.schema.ts
import type { UUID } from "crypto";
import { z } from "zod";

// All queries should start with z.string() since they are strings

export const skipSchema = z
  .string()
  .transform((val) => Number(val))
  .pipe(z.number().int().min(0))
  .describe("The amount of items to skip.");

export const limitSchema = z
  .string()
  .transform((val) => Number(val))
  .pipe(z.number().int().min(0))
  .describe("The limit of items to be returned.");

export const uuidSchema = z
  .string()
  .uuid()
  .transform((val) => val as UUID)
  .describe("id (UUID)");
