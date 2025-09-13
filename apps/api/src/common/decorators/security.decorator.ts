// common/decorators/bearer.decorator.ts
import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiSecurity } from "@nestjs/swagger";
import { UnauthorizedDecorator } from "./swagger-responses.decorator";

export function BearerAuth() {
  return applyDecorators(
    ApiBearerAuth(), // tells Swagger this uses bearer
    UnauthorizedDecorator(),
  );
}

export function ApiKeyAuth() {
  return applyDecorators(ApiSecurity("apiKey"), UnauthorizedDecorator());
}
