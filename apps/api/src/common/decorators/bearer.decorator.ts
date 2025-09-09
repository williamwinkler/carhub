// common/decorators/bearer.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Unauthorized } from './swagger-responses.decorator';

export function BearerAuth() {
  return applyDecorators(
    ApiBearerAuth(), // tells Swagger this uses bearer
    Unauthorized(),
  );
}
