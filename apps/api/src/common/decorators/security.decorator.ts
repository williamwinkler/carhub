// common/decorators/bearer.decorator.ts
import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiSecurity } from "@nestjs/swagger";
import { Errors } from "../errors/errors";
import { SwaggerError } from "./swagger-responses.decorator";

export function BearerAuth() {
  return applyDecorators(
    ApiBearerAuth(), // tells Swagger this uses bearer
    SwaggerError(Errors.UNAUTHORIZED),
  );
}

export function ApiKeyAuth() {
  return applyDecorators(
    ApiSecurity("apiKey"),
    SwaggerError(Errors.UNAUTHORIZED),
  );
}
