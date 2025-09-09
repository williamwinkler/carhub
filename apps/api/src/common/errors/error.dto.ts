import { HttpStatus } from "@nestjs/common";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { ErrorCode } from "./error-codes.enum";

export const ErrorSchema = z.object({
  statusCode: z.enum(HttpStatus).describe("The HTTP status code"),
  errorCode: z.enum(ErrorCode).describe("The application specific error code"),
  message: z.string().describe("The error message"),
  errors: z.array(z.any()).optional().describe("Zod validation errors"),
});

export class ErrorDto extends createZodDto(ErrorSchema) {}
