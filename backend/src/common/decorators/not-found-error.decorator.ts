import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { NotFoundErrorResponse } from '../errors/not-found.error.dto';

export function NotFound() {
  return applyDecorators(
    ApiExtraModels(NotFoundErrorResponse),
    ApiResponse({
      status: 404,
      description: 'Resource not found',
      schema: { $ref: getSchemaPath(NotFoundErrorResponse) },
    }),
  );
}
