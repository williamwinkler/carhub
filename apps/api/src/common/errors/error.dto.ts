import { HttpStatus } from "@nestjs/common";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { ErrorCode } from "./error-codes.enum";

// export const ErrorItemSchema = z.object({
//   code: z.string(),
//   path: z.array(z.union([z.string(), z.number()])),
//   message: z.string(),
//   expected: z.string().optional(),
//   received: z.any().optional(),
//   options: z.array(z.any()).optional(),
//   minimum: z.union([z.number(), z.bigint()]).optional(),
//   maximum: z.union([z.number(), z.bigint()]).optional(),
//   inclusive: z.boolean().optional(),
// });

export const ErrorDtoSchema = z.object({
  statusCode: z.enum(HttpStatus),
  errorCode: z.enum(ErrorCode),
  message: z.string(),
  errors: z.array(z.any()).optional(),
});

export class ErrorDto extends createZodDto(ErrorDtoSchema) {}
