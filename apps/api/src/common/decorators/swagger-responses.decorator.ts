import { applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import type z from "zod";
import type { ErrorSchema } from "../errors/error.dto";
import { ErrorDto } from "../errors/error.dto";
import type { ErrorEntry } from "../errors/errors";
import { EntryToKey } from "../errors/errors";

export function ApiErrorResponse(error: ErrorEntry) {
  const errorCode = EntryToKey.get(error);
  if (!errorCode) {
    throw new Error(`Unknown error entry: ${JSON.stringify(error)}`);
  }

  // Create example value with optional errors array for validation errors
  const exampleValue: z.infer<typeof ErrorSchema> = {
    statusCode: error.status,
    errorCode,
    message: error.message,
  };

  // Add example validation errors for VALIDATION_ERROR responses
  if (errorCode === "VALIDATION_ERROR") {
    exampleValue.errors = [
      {
        field: "email",
        message: "Invalid email format",
        code: "invalid_string",
      },
      {
        field: "age",
        message: "Must be at least 18",
        code: "too_small",
      },
    ];
  }

  return applyDecorators(
    ApiExtraModels(ErrorDto),
    ApiResponse({
      status: error.status,
      description: error.message,
      schema: {
        $ref: getSchemaPath(ErrorDto),
      },
      examples: {
        default: {
          summary: `${errorCode} Error`,
          value: exampleValue,
        },
      },
    }),
  );
}
