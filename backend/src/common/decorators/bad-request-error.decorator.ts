import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { BadRequestErrorResponse } from '../errors/bad-request-error.dto';

export function BadRequest() {
  return applyDecorators(
    ApiExtraModels(BadRequestErrorResponse),
    ApiResponse({
      status: 400,
      description: 'Bad request error',
      schema: { $ref: getSchemaPath(BadRequestErrorResponse) },
    })
  );
}
