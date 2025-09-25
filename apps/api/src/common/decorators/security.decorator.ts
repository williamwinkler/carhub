// common/decorators/bearer.decorator.ts
import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiSecurity } from "@nestjs/swagger";
import { Errors } from "../errors/errors";
import { ApiErrorResponse } from "./swagger-responses.decorator";

export function BearerAuth() {
  return applyDecorators(
    ApiBearerAuth(), // tells Swagger this uses bearer
    ApiErrorResponse(Errors.UNAUTHORIZED),
  );
}

export function ApiKeyAuth() {
  return applyDecorators(
    ApiSecurity("apiKey"),
    ApiErrorResponse(Errors.UNAUTHORIZED),
  );
}
