import { HttpStatus } from "@nestjs/common";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import type { ErrorKey } from "./errors";

export const ErrorSchema = z.object({
  statusCode: z.enum(HttpStatus).describe("The HTTP status code"),
  errorCode: z
    .string()
    .describe("The application specific error code")
    .transform((v) => v as ErrorKey),
  message: z.string().describe("The error message"),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        code: z.string(),
      }),
    )
    .optional()
    .describe("Zod validation errors"),
});

export class ErrorDto extends createZodDto(ErrorSchema) {}
