// src/common/decorators/validation-error.decorator.ts
import { applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { ValidationErrorResponse } from "../errors/validation-error.dto";

export function ValidationError() {
  return applyDecorators(
    ApiExtraModels(ValidationErrorResponse),
    ApiResponse({
      status: 400,
      description: "Validation error",
      schema: { $ref: getSchemaPath(ValidationErrorResponse) },
    }),
  );
}
